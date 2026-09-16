"""
Phase C Normalization & Quality Pipeline Coordinator -- SIH26056

Coordinates:
    ParsedAirfareObservation
        ↓
    Fare Normalization (Double-counting checks, component sums)
        ↓
    Commercial Deduplication (Cross-source channel resolution with DB awareness)
        ↓
    Outlier Classification (IQR & 3.5x median technical ceiling)
        ↓
    Data Quality Scoring (Multi-dimensional empirical DQ)
        ↓
    Persistence into NormalizedIndexObservation
"""
from __future__ import annotations

import logging
import uuid
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.enums import (
    NormalizationStatus,
    AvailabilityStatus,
    OutlierStatus,
    CommercialDedupStatus,
)
from app.models.observation import (
    ParsedAirfareObservation,
    NormalizedIndexObservation,
)
from app.models.route import Route
from app.schemas.normalization import PhaseCNormalizationResponse
from app.services.normalization import normalize_parsed_observation, NormalizedRecord
from app.services.deduplication import deduplicate_commercial_records
from app.services.outlier import classify_outliers
from app.services.data_quality import calculate_data_quality_score

logger = logging.getLogger(__name__)

# Standard routes to auto-populate if missing
DEFAULT_ROUTES = [
    ("DEL-BOM", "DEL", "BOM", "Metro-Metro"),
    ("DEL-BLR", "DEL", "BLR", "Metro-Metro"),
    ("BOM-BLR", "BOM", "BLR", "Metro-Metro"),
    ("DEL-CCU", "DEL", "CCU", "Metro-Metro"),
    ("DEL-HYD", "DEL", "HYD", "Metro-Metro"),
    ("BOM-MAA", "BOM", "MAA", "Metro-Metro"),
    ("DEL-PNQ", "DEL", "PNQ", "Metro-Tier2"),
    ("DEL-PAT", "DEL", "PAT", "Metro-Tier2"),
    ("BOM-COK", "BOM", "COK", "Metro-Tier2"),
]


def _ensure_routes_exist(db: Session):
    """Seed target routes in DB if not already present."""
    for rid, orig, dest, reg in DEFAULT_ROUTES:
        if not db.get(Route, rid):
            db.add(Route(
                route_id=rid,
                origin_iata=orig,
                destination_iata=dest,
                corridor_region=reg,
                dgca_volume_weight=Decimal("0.111111"),
            ))
    db.flush()


def run_phase_c_normalization(
    db: Session,
    parsed_ids: Optional[List[str]] = None,
) -> PhaseCNormalizationResponse:
    """
    Executes the complete Phase C pipeline over parsed airfare observations.
    """
    _ensure_routes_exist(db)

    query = db.query(ParsedAirfareObservation)
    if parsed_ids:
        query = query.filter(ParsedAirfareObservation.observation_id.in_(parsed_ids))

    # Exclude already normalized observations to maintain idempotency
    existing_obs_ids = {
        str(row[0]) for row in db.query(NormalizedIndexObservation.observation_id).all()
    }
    parsed_records = [p for p in query.all() if str(p.observation_id) not in existing_obs_ids]

    if not parsed_records:
        # If all already normalized, query existing stats
        total_norm = db.query(NormalizedIndexObservation).count()
        valid_count = db.query(NormalizedIndexObservation).filter_by(valid_for_index=True).count()
        return PhaseCNormalizationResponse(
            total_parsed_processed=0,
            total_normalized_created=0,
            valid_for_index_count=valid_count,
            commercial_duplicates_count=0,
            outliers_detected_count=0,
            market_surges_count=0,
            imputed_count=0,
            overall_dq_score=Decimal("100.00"),
            status="ALL_RECORDS_ALREADY_NORMALIZED",
        )

    logger.info(f"Phase C: Processing {len(parsed_records)} parsed observations...")

    # Step 1: Fare Normalization
    normalized_records = [normalize_parsed_observation(p) for p in parsed_records]

    # Step 2: Commercial-Equivalence Deduplication (DB-aware across batches)
    dedup_results = deduplicate_commercial_records(parsed_records, normalized_records, db=db)
    for norm_rec, dedup_status, updated_reason in dedup_results:
        norm_rec.commercial_dedup_status = dedup_status
        norm_rec.normalization_reason = updated_reason

    # Step 3: Outlier Classification (Strict 3.5x median ceiling)
    outlier_results = classify_outliers(normalized_records)
    for norm_rec, out_status, is_out in outlier_results:
        norm_rec.outlier_status = out_status
        norm_rec.is_outlier = is_out

    # Step 4: Empirical Data Quality Scoring
    dq_log = calculate_data_quality_score(normalized_records, db=db)

    # Step 5: Persistence into normalized_index_observations
    total_created = 0
    valid_count = 0
    duplicates_count = 0
    outliers_count = 0
    market_surges_count = 0

    for norm in normalized_records:
        if norm.valid_for_index:
            valid_count += 1
        if norm.commercial_dedup_status == CommercialDedupStatus.COMMERCIAL_DUPLICATE:
            duplicates_count += 1
        if norm.outlier_status == OutlierStatus.TECHNICAL_OUTLIER:
            outliers_count += 1
        elif norm.outlier_status == OutlierStatus.POSSIBLE_MARKET_SURGE:
            market_surges_count += 1

        db_norm = NormalizedIndexObservation(
            index_obs_id=uuid.uuid4(),
            observation_id=uuid.UUID(norm.observation_id),
            route_id=norm.route_id,
            booking_horizon=norm.booking_horizon,
            comparable_index_fare=norm.comparable_index_fare,
            raw_displayed_total=norm.raw_displayed_total,
            component_sum=norm.component_sum,
            normalization_status=norm.normalization_status.value,
            normalization_reason=norm.normalization_reason,
            availability_status=norm.availability_status.value,
            outlier_status=norm.outlier_status.value,
            commercial_dedup_status=norm.commercial_dedup_status.value,
            is_imputed=norm.is_imputed,
            imputation_method=norm.imputation_method,
            is_outlier=norm.is_outlier,
            valid_for_index=norm.valid_for_index,
            dq_score=dq_log.dq_score,
        )
        db.add(db_norm)
        total_created += 1

    db.commit()

    logger.info(
        f"Phase C: Created {total_created} normalized observations. "
        f"Valid for index: {valid_count}, Duplicates: {duplicates_count}, "
        f"Technical outliers: {outliers_count}, Surges: {market_surges_count}, "
        f"DQ Score: {dq_log.dq_score}"
    )

    return PhaseCNormalizationResponse(
        total_parsed_processed=len(parsed_records),
        total_normalized_created=total_created,
        valid_for_index_count=valid_count,
        commercial_duplicates_count=duplicates_count,
        outliers_detected_count=outliers_count,
        market_surges_count=market_surges_count,
        imputed_count=0,
        overall_dq_score=dq_log.dq_score,
        status="SUCCESS",
    )