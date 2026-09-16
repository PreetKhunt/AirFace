"""
Fare Normalization Engine -- SIH26056 Phase C

Calculates comparable index fare from parsed components:
    P_comparable = Base Fare + UDF + ASF + GST + YQ

Excludes:
    Convenience Fee, optional baggage, seat selection, payment promotions.

Double-counting & Structural Validation Safeguards:
    - Rejects negative components or convenience_fee >= raw_total_fare.
    - Validates full breakdown against raw displayed total.
    - Flags INCONSISTENT_TOTAL and safely disqualifies from index (valid_for_index=False).
    - Allows total-only fallback only when comparable fare > 0.
    - No arbitrary fare floor (e.g. ₹500 minimum is NOT applied).
"""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Optional

from app.core.enums import (
    NormalizationStatus,
    AvailabilityStatus,
    BOOKING_WINDOW_TO_HORIZON,
)
from app.models.observation import ParsedAirfareObservation


@dataclass
class NormalizedRecord:
    """Intermediate normalized observation before deduplication and outlier scoring."""
    observation_id: str
    route_id: str
    booking_horizon: str
    comparable_index_fare: Decimal
    raw_displayed_total: Decimal
    component_sum: Optional[Decimal]
    normalization_status: NormalizationStatus
    normalization_reason: str
    availability_status: AvailabilityStatus
    valid_for_index: bool
    is_imputed: bool = False
    imputation_method: Optional[str] = None


def normalize_parsed_observation(obs: ParsedAirfareObservation) -> NormalizedRecord:
    """
    Deterministically transforms a ParsedAirfareObservation into a NormalizedRecord.
    Enforces double-counting prevention, component validity, and consistency checks.
    """
    route_id = f"{obs.origin.upper()}-{obs.destination.upper()}"
    horizon = BOOKING_WINDOW_TO_HORIZON.get(obs.booking_window_days, f"T+{obs.booking_window_days}")
    raw_total = Decimal(str(obs.raw_total_fare)) if obs.raw_total_fare is not None else Decimal("0.00")
    conv_fee = Decimal(str(obs.convenience_fee)) if obs.convenience_fee is not None else Decimal("0.00")

    # 1. Check for missing/non-positive raw fare
    if raw_total <= Decimal("0.00"):
        return NormalizedRecord(
            observation_id=str(obs.observation_id),
            route_id=route_id,
            booking_horizon=horizon,
            comparable_index_fare=Decimal("0.00"),
            raw_displayed_total=raw_total,
            component_sum=None,
            normalization_status=NormalizationStatus.MISSING_FARE,
            normalization_reason="NON_POSITIVE_RAW_FARE",
            availability_status=AvailabilityStatus.MISSING_FARE,
            valid_for_index=False,
        )

    # 2. Extract and validate components against negative values
    bf = Decimal(str(obs.base_fare)) if obs.base_fare is not None else None
    udf = Decimal(str(obs.udf_fee)) if obs.udf_fee is not None else None
    asf = Decimal(str(obs.asf_fee)) if obs.asf_fee is not None else None
    gst = Decimal(str(obs.gst_tax)) if obs.gst_tax is not None else None
    yq = Decimal(str(obs.yq_surcharge)) if obs.yq_surcharge is not None else None

    # Check for negative components
    for comp_name, comp_val in [("base_fare", bf), ("udf_fee", udf), ("asf_fee", asf),
                                ("gst_tax", gst), ("yq_surcharge", yq), ("convenience_fee", conv_fee)]:
        if comp_val is not None and comp_val < Decimal("0.00"):
            return NormalizedRecord(
                observation_id=str(obs.observation_id),
                route_id=route_id,
                booking_horizon=horizon,
                comparable_index_fare=Decimal("0.00"),
                raw_displayed_total=raw_total,
                component_sum=None,
                normalization_status=NormalizationStatus.INVALID_COMPONENTS,
                normalization_reason=f"NEGATIVE_FARE_COMPONENT: {comp_name}={comp_val}",
                availability_status=AvailabilityStatus.INVALID_OBSERVATION,
                valid_for_index=False,
            )

    # 3. Check convenience fee validity relative to raw total
    if conv_fee >= raw_total:
        return NormalizedRecord(
            observation_id=str(obs.observation_id),
            route_id=route_id,
            booking_horizon=horizon,
            comparable_index_fare=Decimal("0.00"),
            raw_displayed_total=raw_total,
            component_sum=None,
            normalization_status=NormalizationStatus.INVALID_COMPONENTS,
            normalization_reason=f"CONVENIENCE_FEE_EXCEEDS_OR_EQUALS_RAW_TOTAL: conv={conv_fee} vs raw={raw_total}",
            availability_status=AvailabilityStatus.INVALID_OBSERVATION,
            valid_for_index=False,
        )

    # 4. Full component breakdown
    has_all_components = all(c is not None for c in (bf, udf, asf, gst, yq))

    if has_all_components:
        component_sum = bf + udf + asf + gst + yq
        # Check consistency with raw_total_fare (with or without convenience_fee)
        if component_sum == raw_total or component_sum == (raw_total - conv_fee):
            return NormalizedRecord(
                observation_id=str(obs.observation_id),
                route_id=route_id,
                booking_horizon=horizon,
                comparable_index_fare=component_sum,
                raw_displayed_total=raw_total,
                component_sum=component_sum,
                normalization_status=NormalizationStatus.VALID,
                normalization_reason="FULL_BREAKDOWN_EXACT",
                availability_status=AvailabilityStatus.VALID,
                valid_for_index=True,
            )
        else:
            # Component sum differs from raw displayed total -> mark inconsistent and disqualify from index
            return NormalizedRecord(
                observation_id=str(obs.observation_id),
                route_id=route_id,
                booking_horizon=horizon,
                comparable_index_fare=component_sum,
                raw_displayed_total=raw_total,
                component_sum=component_sum,
                normalization_status=NormalizationStatus.INCONSISTENT_TOTAL,
                normalization_reason=f"COMPONENT_SUM_MISMATCH: components={component_sum} vs raw={raw_total}",
                availability_status=AvailabilityStatus.VALID,
                valid_for_index=False,  # Disqualified from index calculation due to component mismatch
            )

    # 5. Partial components or total-only observation
    comparable_fare = raw_total - conv_fee
    if comparable_fare > Decimal("0.00"):
        return NormalizedRecord(
            observation_id=str(obs.observation_id),
            route_id=route_id,
            booking_horizon=horizon,
            comparable_index_fare=comparable_fare,
            raw_displayed_total=raw_total,
            component_sum=None,
            normalization_status=NormalizationStatus.PARTIAL_COMPONENTS,
            normalization_reason="TOTAL_ONLY_FALLBACK",
            availability_status=AvailabilityStatus.VALID,
            valid_for_index=True,
        )
    else:
        return NormalizedRecord(
            observation_id=str(obs.observation_id),
            route_id=route_id,
            booking_horizon=horizon,
            comparable_index_fare=Decimal("0.00"),
            raw_displayed_total=raw_total,
            component_sum=None,
            normalization_status=NormalizationStatus.INVALID_COMPONENTS,
            normalization_reason="NON_POSITIVE_COMPARABLE_FARE",
            availability_status=AvailabilityStatus.INVALID_OBSERVATION,
            valid_for_index=False,
        )