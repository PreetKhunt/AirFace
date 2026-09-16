"""
Outlier Classification Engine -- SIH26056 Phase C

Performs objective statistical screening per (route_id, booking_horizon) cell using
IQR and robust median bounds.

Classification:
- VALID_OBSERVATION: Fare within normal statistical bounds or lower-tail promotional positive fare.
  Preserved for index calculation (valid_for_index=True).
- POSSIBLE_MARKET_SURGE: Statistically elevated fare (above 1.5*IQR, up to 3.5*median).
  Preserved for index calculation (valid_for_index=True) because market surges are legitimate economic signals.
- TECHNICAL_OUTLIER: Malformed / extreme corrupt fare (> 3.5*median or non-positive <= 0).
  Disqualified from index (valid_for_index=False).
"""
from __future__ import annotations

import statistics
from collections import defaultdict
from decimal import Decimal
from typing import List, Tuple

from app.core.enums import OutlierStatus
from app.services.normalization import NormalizedRecord


def classify_outliers(
    records: List[NormalizedRecord],
) -> List[Tuple[NormalizedRecord, OutlierStatus, bool]]:
    """
    Evaluates each record against its route-horizon cell distribution.
    Returns list of (normalized_record, outlier_status, is_outlier).
    """
    cells = defaultdict(list)
    for rec in records:
        cells[(rec.route_id, rec.booking_horizon)].append(rec)

    results: List[Tuple[NormalizedRecord, OutlierStatus, bool]] = []

    for cell_key, cell_records in cells.items():
        valid_fares = [
            float(r.comparable_index_fare)
            for r in cell_records
            if r.valid_for_index and r.comparable_index_fare > 0
        ]

        if len(valid_fares) < 4:
            for r in cell_records:
                results.append((r, OutlierStatus.VALID_OBSERVATION, False))
            continue

        median_fare = statistics.median(valid_fares)
        try:
            quantiles = statistics.quantiles(valid_fares, n=4)
            q1, q3 = quantiles[0], quantiles[2]
        except Exception:
            sorted_fares = sorted(valid_fares)
            n = len(sorted_fares)
            q1 = sorted_fares[n // 4]
            q3 = sorted_fares[(3 * n) // 4]

        iqr = q3 - q1
        if iqr == 0:
            iqr = q3 * 0.10 or 100.0

        lower_fence = max(0.0, q1 - 1.5 * iqr)
        upper_fence = q3 + 1.5 * iqr
        technical_ceiling = median_fare * 3.5

        for rec in cell_records:
            fare = float(rec.comparable_index_fare)

            # 1. Technical outlier: non-positive, corrupt, or exceeds 3.5x median ceiling
            if fare <= 0 or fare > technical_ceiling:
                results.append((rec, OutlierStatus.TECHNICAL_OUTLIER, True))
                rec.valid_for_index = False
            # 2. Lower-tail positive fare (promotional/off-peak): statistically low but preserved for index
            elif fare < lower_fence:
                results.append((rec, OutlierStatus.VALID_OBSERVATION, False))
            # 3. Valid observation within normal upper fence
            elif fare <= upper_fence:
                results.append((rec, OutlierStatus.VALID_OBSERVATION, False))
            # 4. Market surge: elevated above upper fence but within 3.5x median ceiling
            else:
                results.append((rec, OutlierStatus.POSSIBLE_MARKET_SURGE, True))

    return results