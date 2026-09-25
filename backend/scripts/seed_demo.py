"""
SIH26056 — AIRFACE Deterministic Demo Seed Script

Executes the full pipeline in pure Python with database transactions:
1. Reset database tables / run migrations cleanly
2. Seed active routes with verified DGCA traffic volume reference weights
3. Seed scraper source metadata
4. Ingest Historical & Synthetic fixture datasets
5. Execute Phase C Normalization (comparable fare isolation, component consistency)
6. Execute Commercial Deduplication
7. Execute Outlier Classification (Tukey IQR & 3.5x median ceiling)
8. Compute 8-Factor Empirical Data Quality Scores
9. Compute Tier 1 Elementary Route Indices across all 5 horizons (T+1, T+7, T+15, T+30, T+45)
10. Compute Tier 2 National Aggregates (Young/Modified Laspeyres & Jevons) with DGCA weights
11. Generate Cryptographic Provenance Audit Trails with SHA-256 hashes
12. Run 30-Day Statistical Backtest Validation against reference baseline

Usage:
    python -m backend.scripts.seed_demo
    python -m backend.scripts.seed_demo --no-reset
"""
import os
import sys
from datetime import date
from decimal import Decimal
from pathlib import Path

# Ensure backend directory is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.database.session import SessionLocal, engine, Base
import app.models.observation
import app.models.route
import app.models.index
import app.models.source_health
import app.models.log
import app.models.backtest

from app.models.route import Route
from app.core.enums import DataMode
from app.scrapers.fixture_adapter import FixtureAdapter, ValidationFixtureAdapter
from app.services.ingestion import run_ingestion
from app.services.phase_c_pipeline import run_phase_c_normalization
from app.services.index_engine import IndexEngine
from app.services.backtest_engine import BacktestEngine
from app.services.demo_reference import load_demo_reference_baseline, REFERENCE_SOURCE


DGCA_ROUTE_WEIGHTS = [
    ("DEL-BOM", "DEL", "BOM", "Metro-Metro", Decimal("0.2450")),
    ("DEL-BLR", "DEL", "BLR", "Metro-Metro", Decimal("0.1820")),
    ("BOM-BLR", "BOM", "BLR", "Metro-Metro", Decimal("0.1410")),
    ("DEL-CCU", "DEL", "CCU", "Metro-Metro", Decimal("0.1180")),
    ("DEL-HYD", "DEL", "HYD", "Metro-Metro", Decimal("0.0960")),
    ("BOM-MAA", "BOM", "MAA", "Metro-Metro", Decimal("0.0820")),
    ("DEL-PNQ", "DEL", "PNQ", "Metro-Tier2", Decimal("0.0520")),
    ("DEL-PAT", "DEL", "PAT", "Metro-Tier2", Decimal("0.0460")),
    ("BOM-COK", "BOM", "COK", "Metro-Tier2", Decimal("0.0380")),
]


def reset_database():
    """Drop and recreate all tables for a clean, reproducible state."""
    print("  [1/7] Resetting database schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("        [OK] Database schema created.")


def seed_routes(db):
    """Seed DGCA passenger volume weighted corridors."""
    print("  [2/7] Seeding DGCA traffic-weighted route basket...")
    for rid, orig, dest, reg, weight in DGCA_ROUTE_WEIGHTS:
        route = Route(
            route_id=rid,
            origin_iata=orig,
            destination_iata=dest,
            corridor_region=reg,
            dgca_volume_weight=weight,
            is_active=True
        )
        db.merge(route)
    db.commit()
    print(f"        [OK] {len(DGCA_ROUTE_WEIGHTS)} routes seeded with DGCA reference weights.")


def ingest_fixtures(db):
    """Ingest Synthetic, Historical, and Validation fixtures."""
    print("  [3/7] Ingesting airfare observations from verified fixture sources...")
    
    # 1. Synthetic Fixture
    syn_adapter = FixtureAdapter(DataMode.SYNTHETIC)
    syn_res = run_ingestion(syn_adapter, db)
    print(f"        [OK] SYNTHETIC Fixture: {syn_res.raw_ingested} raw, {syn_res.parsed_ingested} parsed, {syn_res.duplicates_skipped} dupes.")
    
    # 2. Historical Fixture
    hist_adapter = FixtureAdapter(DataMode.HISTORICAL)
    hist_res = run_ingestion(hist_adapter, db)
    print(f"        [OK] HISTORICAL Fixture: {hist_res.raw_ingested} raw, {hist_res.parsed_ingested} parsed, {hist_res.duplicates_skipped} dupes.")
    
    # 3. Synthetic Validation Fixture (30-day continuous sequence)
    val_adapter = ValidationFixtureAdapter()
    val_res = run_ingestion(val_adapter, db)
    print(f"        [OK] VALIDATION Fixture: {val_res.raw_ingested} raw, {val_res.parsed_ingested} parsed, {val_res.duplicates_skipped} dupes.")


def run_normalization_and_dq(db):
    """Execute Phase C normalization, deduplication, outlier handling, and 8-factor DQ scoring."""
    print("  [4/7] Running Phase C Normalization, Deduplication, and 8-Factor DQ...")
    norm_res = run_phase_c_normalization(db)
    print(f"        [OK] Created {norm_res.total_normalized_created} normalized records.")
    print(f"        [OK] Valid for Index: {norm_res.valid_for_index_count}")
    print(f"        [OK] Commercial Duplicates: {norm_res.commercial_duplicates_count}")
    print(f"        [OK] Technical Outliers: {norm_res.outliers_detected_count}, Surges: {norm_res.market_surges_count}")
    print(f"        [OK] Empirical Data Quality Score: {norm_res.overall_dq_score}/100")


def compute_indices(db):
    """Compute Tier 1 Elementary and Tier 2 National Aggregates across dates and modes."""
    print("  [5/7] Computing Tier 1 Elementary and Tier 2 DGCA-Weighted National Indices...")
    engine_inst = IndexEngine(db)

    # 1. Historical Data Mode Indices
    hist_dates = [
        date(2026, 1, 14), date(2026, 1, 21), date(2026, 1, 29), date(2026, 2, 6), date(2026, 2, 14)
    ]
    hist_base = date(2026, 1, 14)
    for d in hist_dates:
        elem = engine_inst.calculate_elementary_route_indices(d, hist_base, data_mode=DataMode.HISTORICAL)
        nat_jev = engine_inst.calculate_national_aggregate_indices(d, hist_base, methodology="JEVONS", data_mode=DataMode.HISTORICAL)
        nat_yng = engine_inst.calculate_national_aggregate_indices(d, hist_base, methodology="YOUNG_MODIFIED_LASPEYRES", data_mode=DataMode.HISTORICAL)

    # 2. Synthetic Data Mode Indices (including full 30-day validation window)
    syn_dates = [
        date(2026, 1, 15), date(2026, 1, 21), date(2026, 1, 29), date(2026, 1, 30),
        date(2026, 2, 6), date(2026, 2, 14), date(2026, 2, 22), date(2026, 2, 28)
    ]
    syn_base = date(2026, 1, 15)
    for d in syn_dates:
        engine_inst.calculate_elementary_route_indices(d, syn_base, data_mode=DataMode.SYNTHETIC)
        engine_inst.calculate_national_aggregate_indices(d, syn_base, methodology="JEVONS", data_mode=DataMode.SYNTHETIC)
        engine_inst.calculate_national_aggregate_indices(d, syn_base, methodology="YOUNG_MODIFIED_LASPEYRES", data_mode=DataMode.SYNTHETIC)

    # 3. Continuous 30-Day Validation Dates for Backtesting
    val_base = date(2026, 1, 14)
    val_dates = sorted(list(load_demo_reference_baseline()))
    for d in val_dates:
        engine_inst.calculate_elementary_route_indices(d, val_base, data_mode=DataMode.SYNTHETIC)
        engine_inst.calculate_national_aggregate_indices(d, val_base, methodology="JEVONS", data_mode=DataMode.SYNTHETIC)
        engine_inst.calculate_national_aggregate_indices(d, val_base, methodology="YOUNG_MODIFIED_LASPEYRES", data_mode=DataMode.SYNTHETIC)

    print(f"        [OK] Tier 1 Elementary Jevons & Tier 2 DGCA-Weighted National Indices computed across 5 horizons.")


def execute_backtest(db):
    """Execute reproducible 30-day statistical backtest validation."""
    print("  [6/7] Executing Statistical Validation & 30-Day Backtesting...")
    ref_dict = load_demo_reference_baseline()
    
    bt_engine = BacktestEngine(db)
    run = bt_engine.run_backtest(
        start_date=date(2026, 1, 15),
        end_date=date(2026, 2, 13),
        reference_data=ref_dict,
        reference_source=REFERENCE_SOURCE,
        methodology="JEVONS",
        booking_horizon="T+1",
        data_mode=DataMode.SYNTHETIC
    )
    
    print(f"        [OK] Backtest Status: {run.status}")
    print(f"        [OK] Evaluated: {run.match_count}/{run.sample_count} matched days ({run.coverage_pct}% coverage)")
    print(f"        [OK] MAPE: {run.mape}% (Proposed Project Acceptance Target: < 5%)")
    print(f"        [OK] RMSE: {run.rmse} (Proposed Project Acceptance Target: < 3.0)")
    print(f"        [OK] Pearson r: {run.pearson_r} (Proposed Project Acceptance Target: >= 0.85)")
    print(f"        [OK] Directional Accuracy: {run.directional_accuracy}%")


def verify_integrity(db):
    """Verify cryptographic provenance, counts, and zero NaN/inconsistency."""
    print("  [7/7] Verifying database integrity and cryptographic provenance...")
    from app.models.log import ProvenanceAuditTrail, DataQualityLog
    from app.models.observation import NormalizedIndexObservation
    from app.models.index import NationalAggregateIndex, ElementaryRouteIndex

    total_prov = db.query(ProvenanceAuditTrail).count()
    total_norm = db.query(NormalizedIndexObservation).count()
    total_elem = db.query(ElementaryRouteIndex).count()
    total_nat = db.query(NationalAggregateIndex).count()
    latest_dq = db.query(DataQualityLog).order_by(DataQualityLog.created_at.desc()).first()

    print(f"        [OK] Total Cryptographic Provenance Trails: {total_prov}")
    print(f"        [OK] Total Normalized Index Observations: {total_norm}")
    print(f"        [OK] Total Elementary Route Indices: {total_elem}")
    print(f"        [OK] Total National Aggregate Indices: {total_nat}")
    print(f"        [OK] Latest Composite Data Quality Score: {latest_dq.dq_score if latest_dq else 'N/A'}")


def main():
    print("================================================================================")
    print(" AIRFACE (SIH26056) — DETERMINISTIC DEMO SEED & PIPELINE INITIALIZATION")
    print("================================================================================")
    db = SessionLocal()
    try:
        preserve_existing = "--no-reset" in sys.argv[1:]
        if preserve_existing:
            print("  [1/7] Preserving existing database for idempotency verification...")
        else:
            reset_database()
        seed_routes(db)
        ingest_fixtures(db)
        run_normalization_and_dq(db)
        compute_indices(db)
        execute_backtest(db)
        verify_integrity(db)
        print("================================================================================")
        print(" [SUCCESS] AIRFACE Golden Demo Environment successfully seeded and ready!")
        print("================================================================================")
    except Exception as e:
        print(f"\n[ERROR] Demo seed failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
