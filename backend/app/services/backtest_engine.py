import math
from typing import List, Optional, Tuple, Dict
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy.orm import Session

from app.models.backtest import BacktestRun
from app.models.index import ElementaryRouteIndex, NationalAggregateIndex
from app.core.enums import DataMode

class BacktestEngine:
    """
    Validation & 30-Day Backtesting Engine (Phase E).
    Computes MAPE, RMSE, Pearson r, Mean Percentage Bias, and Directional Accuracy.
    """

    def __init__(self, db: Session):
        self.db = db

    def run_backtest(
        self,
        start_date: date,
        end_date: date,
        reference_data: Dict[date, float],
        reference_source: str,
        methodology: str,
        booking_horizon: str,
        route_id: Optional[str] = None,
        data_mode: DataMode = DataMode.LIVE
    ) -> BacktestRun:
        """
        Executes a temporal-aligned backtest against a reference dataset.
        reference_data is a dictionary mapping calculation_date to the reference index value.
        """
        
        # 1. Fetch our calculated indices
        if route_id:
            indices = self.db.query(ElementaryRouteIndex).filter(
                ElementaryRouteIndex.calculation_date >= start_date,
                ElementaryRouteIndex.calculation_date <= end_date,
                ElementaryRouteIndex.route_id == route_id,
                ElementaryRouteIndex.booking_horizon == booking_horizon,
                ElementaryRouteIndex.methodology == methodology,
                ElementaryRouteIndex.data_mode == data_mode
            ).order_by(ElementaryRouteIndex.calculation_date).all()
        else:
            indices = self.db.query(NationalAggregateIndex).filter(
                NationalAggregateIndex.calculation_date >= start_date,
                NationalAggregateIndex.calculation_date <= end_date,
                NationalAggregateIndex.booking_horizon == booking_horizon,
                NationalAggregateIndex.methodology == methodology,
                NationalAggregateIndex.data_mode == data_mode
            ).order_by(NationalAggregateIndex.calculation_date).all()

        scraped_data = {idx.calculation_date: float(idx.index_value) for idx in indices}
        
        # 2. Temporal Alignment: Match observation pairs
        aligned_pairs: List[Tuple[float, float]] = [] # (scraped, reference)
        matched_dates = []
        
        for d, ref_val in reference_data.items():
            # Implicit zero protection
            if ref_val <= 0:
                continue
                
            if d in scraped_data:
                aligned_pairs.append((scraped_data[d], ref_val))
                matched_dates.append(d)

        n = len(aligned_pairs)
        sample_count = len(reference_data)
        coverage_pct = (n / sample_count * 100) if sample_count > 0 else 0.0

        if n == 0:
            return self._save_empty_run(
                start_date, end_date, methodology, reference_source, booking_horizon, route_id, data_mode,
                sample_count, n, coverage_pct, "INSUFFICIENT_DATA"
            )

        # 3. Validation Metrics
        
        # MAPE: Mean Absolute Percentage Error
        # RMSE: Root Mean Square Error
        # Bias: Mean Percentage Bias
        
        abs_pct_errors = []
        pct_biases = []
        sq_errors = []
        
        for s, r in aligned_pairs:
            err = s - r
            sq_errors.append(err * err)
            pct_err = err / r
            abs_pct_errors.append(abs(pct_err))
            pct_biases.append(pct_err) # Positive if our index > reference

        mape = (sum(abs_pct_errors) / n) * 100.0
        rmse = math.sqrt(sum(sq_errors) / n)
        mean_bias_pct = (sum(pct_biases) / n) * 100.0

        # Pearson Correlation (r)
        pearson_r = None
        if n >= 2:
            mean_s = sum(s for s, r in aligned_pairs) / n
            mean_r = sum(r for s, r in aligned_pairs) / n
            
            num = sum((s - mean_s) * (r - mean_r) for s, r in aligned_pairs)
            den_s = sum((s - mean_s)**2 for s, r in aligned_pairs)
            den_r = sum((r - mean_r)**2 for s, r in aligned_pairs)
            
            if den_s > 0 and den_r > 0:
                pearson_r = num / math.sqrt(den_s * den_r)
        
        # Directional Accuracy (DA)
        da_matches = 0
        da_comparisons = 0
        
        matched_dates.sort()
        for i in range(1, len(matched_dates)):
            curr_date = matched_dates[i]
            prev_date = matched_dates[i-1]
            
            # Ensure consecutive days for standard DA
            if (curr_date - prev_date).days == 1:
                s_curr = scraped_data[curr_date]
                s_prev = scraped_data[prev_date]
                r_curr = reference_data[curr_date]
                r_prev = reference_data[prev_date]
                
                delta_s = s_curr - s_prev
                delta_r = r_curr - r_prev
                
                sgn_s = 1 if delta_s > 0 else (-1 if delta_s < 0 else 0)
                sgn_r = 1 if delta_r > 0 else (-1 if delta_r < 0 else 0)
                
                if sgn_s == sgn_r:
                    da_matches += 1
                da_comparisons += 1
                
        directional_accuracy = (da_matches / da_comparisons * 100.0) if da_comparisons > 0 else None
        
        status = "COMPLETED"
        if n < 3: # Need at least some pairs to be meaningful
            status = "INSUFFICIENT_DATA"

        return self._save_run(
            start_date, end_date, methodology, reference_source, booking_horizon, route_id, data_mode,
            sample_count, n, coverage_pct,
            mape, rmse, pearson_r, mean_bias_pct, directional_accuracy, status
        )

    def _save_empty_run(self, *args):
        return self._save_run(*args, None, None, None, None, None)

    def _save_run(self, start_date, end_date, methodology, reference_source, booking_horizon, route_id, data_mode,
                  sample_count, match_count, coverage_pct, mape, rmse, pearson_r, mean_bias_pct, directional_accuracy, status="COMPLETED"):
        
        run = BacktestRun(
            start_date=start_date,
            end_date=end_date,
            methodology=methodology,
            reference_source=reference_source,
            booking_horizon=booking_horizon,
            route_id=route_id,
            data_mode=data_mode,
            sample_count=sample_count,
            match_count=match_count,
            coverage_pct=Decimal(str(coverage_pct)).quantize(Decimal('0.00'), rounding=ROUND_HALF_UP),
            mape=Decimal(str(mape)).quantize(Decimal('0.0000'), rounding=ROUND_HALF_UP) if mape is not None else None,
            rmse=Decimal(str(rmse)).quantize(Decimal('0.0000'), rounding=ROUND_HALF_UP) if rmse is not None else None,
            pearson_r=Decimal(str(pearson_r)).quantize(Decimal('0.0000'), rounding=ROUND_HALF_UP) if pearson_r is not None else None,
            mean_bias_pct=Decimal(str(mean_bias_pct)).quantize(Decimal('0.0000'), rounding=ROUND_HALF_UP) if mean_bias_pct is not None else None,
            directional_accuracy=Decimal(str(directional_accuracy)).quantize(Decimal('0.0000'), rounding=ROUND_HALF_UP) if directional_accuracy is not None else None,
            status=status
        )
        self.db.add(run)
        self.db.commit()
        return run
