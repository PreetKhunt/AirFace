import uuid
import math
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Tuple, Dict
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func

from app.models.index import ElementaryRouteIndex, NationalAggregateIndex
from app.models.observation import NormalizedIndexObservation, ParsedAirfareObservation, RawAirfareObservation
from app.models.route import Route
from app.core.enums import DataMode


def get_active_data_mode(db: Session) -> Optional[DataMode]:
    """Return the mode of the most recently persisted airfare observation."""
    latest_mode = (
        db.query(RawAirfareObservation.collection_mode)
        .order_by(
            RawAirfareObservation.created_at.desc(),
            RawAirfareObservation.collection_timestamp.desc(),
        )
        .first()
    )
    return latest_mode[0] if latest_mode else None


class IndexEngine:
    """
    Index Engine Subsystem (Phase D).
    Calculates Tier 1 (Jevons) and Tier 2 (Young/Modified Laspeyres) indices.
    """
    
    def __init__(self, db: Session):
        self.db = db

    def calculate_elementary_route_indices(
        self,
        calculation_date: date,
        base_date: date,
        methodology: str = "JEVONS",
        data_mode: DataMode = DataMode.LIVE
    ) -> List[ElementaryRouteIndex]:
        """
        Tier 1: Elementary Route Index calculation.
        Computes the unweighted Jevons Geometric Mean Index per Route x Horizon.
        """
        # Fetch target observations for the calculation date
        target_obs = self._fetch_eligible_observations(calculation_date, data_mode)
        if not target_obs:
            return []

        # Fetch reference observations for the base date
        base_obs = self._fetch_eligible_observations(base_date, data_mode)
        
        # Build reference dictionary: (route_id, booking_horizon, flight_number) -> avg_fare
        # A flight might have multiple observations if collected at different times, so we average them for the reference.
        reference_fares: Dict[Tuple[str, str, str], List[Decimal]] = {}
        for norm, parsed in base_obs:
            key = (norm.route_id, norm.booking_horizon, parsed.flight_number)
            if key not in reference_fares:
                reference_fares[key] = []
            reference_fares[key].append(norm.comparable_index_fare)
            
        base_avg_fares: Dict[Tuple[str, str, str], Decimal] = {
            k: sum(v) / len(v) for k, v in reference_fares.items()
        }

        # Group target observations by cell (route_id, booking_horizon)
        cells: Dict[Tuple[str, str], List[Tuple[NormalizedIndexObservation, ParsedAirfareObservation]]] = {}
        for norm, parsed in target_obs:
            key = (norm.route_id, norm.booking_horizon)
            if key not in cells:
                cells[key] = []
            cells[key].append((norm, parsed))

        results = []
        for (route_id, horizon), obs_list in cells.items():
            log_relatives = []
            valid_count = 0
            
            for norm, parsed in obs_list:
                ref_key = (route_id, horizon, parsed.flight_number)
                ref_price = base_avg_fares.get(ref_key)
                
                if ref_price and ref_price > 0 and norm.comparable_index_fare > 0:
                    price_relative = float(norm.comparable_index_fare) / float(ref_price)
                    log_relatives.append(math.log(price_relative))
                    valid_count += 1
            
            if valid_count > 0:
                mean_log = sum(log_relatives) / valid_count
                index_val = math.exp(mean_log) * 100.0
                
                # Delete existing if any (idempotency)
                self.db.query(ElementaryRouteIndex).filter(
                    ElementaryRouteIndex.calculation_date == calculation_date,
                    ElementaryRouteIndex.route_id == route_id,
                    ElementaryRouteIndex.booking_horizon == horizon,
                    ElementaryRouteIndex.methodology == methodology,
                    ElementaryRouteIndex.data_mode == data_mode
                ).delete()
                
                # Get total parsed obs for this route/horizon to compute coverage
                total_obs = self.db.query(ParsedAirfareObservation)\
                    .join(RawAirfareObservation, ParsedAirfareObservation.raw_id == RawAirfareObservation.raw_id)\
                    .filter(
                        ParsedAirfareObservation.origin == route_id.split('-')[0],
                        ParsedAirfareObservation.destination == route_id.split('-')[1],
                        ParsedAirfareObservation.booking_window_days == int(horizon.replace('T+', '')),
                        func.date(RawAirfareObservation.collection_timestamp) == calculation_date,
                        RawAirfareObservation.collection_mode == data_mode
                    ).count()
                
                coverage_val = Decimal(str((valid_count / total_obs) * 100)).quantize(Decimal('0.00')) if total_obs > 0 else Decimal("0.00")
                
                elementary_index = ElementaryRouteIndex(
                    calculation_date=calculation_date,
                    route_id=route_id,
                    booking_horizon=horizon,
                    methodology=methodology,
                    data_mode=data_mode,
                    index_value=Decimal(str(index_val)).quantize(Decimal('0.0000'), rounding=ROUND_HALF_UP),
                    observation_count=valid_count,
                    coverage_pct=coverage_val,
                    base_date=base_date
                )
                self.db.add(elementary_index)
                results.append(elementary_index)

        self.db.commit()
        return results

    def calculate_national_aggregate_indices(
        self,
        calculation_date: date,
        base_date: date,
        methodology: str = "YOUNG_MODIFIED_LASPEYRES",
        data_mode: DataMode = DataMode.LIVE
    ) -> List[NationalAggregateIndex]:
        """
        Tier 2: National Aggregate Price Index.
        Aggregates elementary indices using DGCA weights.
        """
        # Fetch active routes and their weights
        routes = self.db.query(Route).filter(Route.is_active == True).all()
        if not routes:
            return []
            
        total_weight = sum([r.dgca_volume_weight for r in routes])
        if total_weight == 0:
            return []
            
        normalized_weights = {
            r.route_id: r.dgca_volume_weight / total_weight for r in routes
        }

        # Fetch elementary indices for the date
        elementary_indices = self.db.query(ElementaryRouteIndex).filter(
            ElementaryRouteIndex.calculation_date == calculation_date,
            ElementaryRouteIndex.methodology == "JEVONS",  # National always aggregates the Tier 1 Jevons
            ElementaryRouteIndex.data_mode == data_mode
        ).all()
        
        # Group by horizon
        horizons = {}
        for idx in elementary_indices:
            if idx.booking_horizon not in horizons:
                horizons[idx.booking_horizon] = []
            horizons[idx.booking_horizon].append(idx)
            
        results = []
        for horizon, indices in horizons.items():
            observed_weight = sum(
                float(normalized_weights.get(idx.route_id, 0)) for idx in indices
            )
            if observed_weight <= 0:
                continue

            if methodology == "YOUNG_MODIFIED_LASPEYRES":
                national_val = sum(
                    float(idx.index_value) * float(normalized_weights.get(idx.route_id, 0)) / observed_weight
                    for idx in indices
                )
            elif methodology == "JEVONS":
                log_sum = sum(
                    math.log(float(idx.index_value)) * float(normalized_weights.get(idx.route_id, 0)) / observed_weight
                    for idx in indices if float(idx.index_value) > 0
                )
                national_val = math.exp(log_sum)
            else:
                raise ValueError(f"Unsupported methodology: {methodology}")
            
            # Delete existing
            self.db.query(NationalAggregateIndex).filter(
                NationalAggregateIndex.calculation_date == calculation_date,
                NationalAggregateIndex.booking_horizon == horizon,
                NationalAggregateIndex.methodology == methodology,
                NationalAggregateIndex.data_mode == data_mode
            ).delete()
            # Get latest DQ score
            from app.models.log import DataQualityLog
            latest_dq = self.db.query(DataQualityLog).filter(
                DataQualityLog.calculation_date == calculation_date
            ).order_by(DataQualityLog.created_at.desc()).first()
            dq_val = latest_dq.dq_score if latest_dq else Decimal("0.00")

            national_index = NationalAggregateIndex(
                calculation_date=calculation_date,
                booking_horizon=horizon,
                methodology=methodology,
                data_mode=data_mode,
                index_value=Decimal(str(national_val)).quantize(Decimal('0.0000'), rounding=ROUND_HALF_UP),
                route_count=len(indices),
                coverage_pct=Decimal(str(observed_weight * 100)).quantize(Decimal('0.00')),
                dq_score=dq_val,
                base_date=base_date
            )
            self.db.add(national_index)
            results.append(national_index)
            
        self.db.commit()
        return results

    def calculate_period_average(
        self,
        start_date: date,
        end_date: date,
        horizon: str,
        methodology: str = "JEVONS",
        data_mode: DataMode = DataMode.LIVE
    ) -> Optional[Decimal]:
        """
        Calculates Weekly/Monthly Aggregated Index as the arithmetic mean 
        of daily indices for the given period.
        """
        indices = self.db.query(NationalAggregateIndex).filter(
            NationalAggregateIndex.calculation_date >= start_date,
            NationalAggregateIndex.calculation_date <= end_date,
            NationalAggregateIndex.booking_horizon == horizon,
            NationalAggregateIndex.methodology == methodology,
            NationalAggregateIndex.data_mode == data_mode
        ).all()
        
        if not indices:
            return None
            
        avg_val = sum(idx.index_value for idx in indices) / len(indices)
        return Decimal(str(avg_val)).quantize(Decimal('0.0000'), rounding=ROUND_HALF_UP)

    def _fetch_eligible_observations(self, target_date: date, data_mode: DataMode) -> List[Tuple[NormalizedIndexObservation, ParsedAirfareObservation]]:
        stmt = (
            select(NormalizedIndexObservation, ParsedAirfareObservation)
            .join(ParsedAirfareObservation, NormalizedIndexObservation.observation_id == ParsedAirfareObservation.observation_id)
            .join(RawAirfareObservation, ParsedAirfareObservation.raw_id == RawAirfareObservation.raw_id)
            .where(
                and_(
                    NormalizedIndexObservation.valid_for_index == True,
                    func.date(RawAirfareObservation.collection_timestamp) == target_date,
                    RawAirfareObservation.collection_mode == data_mode
                )
            )
        )
        return self.db.execute(stmt).all()
