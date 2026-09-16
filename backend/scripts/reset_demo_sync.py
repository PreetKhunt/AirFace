import os
import sys
from datetime import date
from sqlalchemy.orm import Session

# Add the project root to sys.path so we can import 'app'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal, engine, Base
from app.services.ingestion_engine import IngestionEngine
from app.services.normalization_engine import NormalizationEngine
from app.services.index_engine import IndexEngine
from app.services.backtest_engine import BacktestEngine
from app.core.enums import DataMode

def reset_db():
    print("Resetting SQLite DB via Alembic...")
    os.system("alembic downgrade base")
    os.system("alembic upgrade head")
    print("DB reset complete.")

def populate_demo_data():
    db = SessionLocal()
    try:
        calc_date = date.today()
        base_date = calc_date.replace(day=1)
        
        print("1. Ingesting fixtures (SYNTHETIC)...")
        IngestionEngine(db).ingest_fixture_data(data_mode=DataMode.SYNTHETIC)
        print("1. Ingesting fixtures (HISTORICAL)...")
        IngestionEngine(db).ingest_fixture_data(data_mode=DataMode.HISTORICAL)
        
        print("2. Running Normalization (SYNTHETIC)...")
        NormalizationEngine(db).normalize_pending_observations(batch_size=1000)
        
        print("3. Calculating Indices (SYNTHETIC)...")
        IndexEngine(db).calculate_elementary_route_indices(calc_date, base_date, DataMode.SYNTHETIC)
        IndexEngine(db).calculate_national_aggregate_indices(calc_date, base_date, "JEVONS", DataMode.SYNTHETIC)
        IndexEngine(db).calculate_national_aggregate_indices(calc_date, base_date, "YOUNG_MODIFIED_LASPEYRES", DataMode.SYNTHETIC)
        
        print("3. Calculating Indices (HISTORICAL)...")
        IndexEngine(db).calculate_elementary_route_indices(calc_date, base_date, DataMode.HISTORICAL)
        IndexEngine(db).calculate_national_aggregate_indices(calc_date, base_date, "JEVONS", DataMode.HISTORICAL)
        IndexEngine(db).calculate_national_aggregate_indices(calc_date, base_date, "YOUNG_MODIFIED_LASPEYRES", DataMode.HISTORICAL)
        
        print("4. Running Backtest (SYNTHETIC)...")
        try:
            BacktestEngine(db).execute_30_day_backtest(calc_date, DataMode.SYNTHETIC)
        except Exception as e:
            print(f"   Backtest note: {e}")
            
        print("4. Running Backtest (HISTORICAL)...")
        try:
            BacktestEngine(db).execute_30_day_backtest(calc_date, DataMode.HISTORICAL)
        except Exception as e:
            print(f"   Backtest note: {e}")
            
        print("\nGolden Demo Dataset successfully generated.")
    except Exception as e:
        print(f"Error during population: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    reset_db()
    populate_demo_data()
