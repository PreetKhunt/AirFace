import uuid
from sqlalchemy import Column, String, Integer, Numeric, Date, DateTime, func, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from app.database.session import Base
from app.core.enums import DataMode

class BacktestRun(Base):
    """
    Stores 30-day backtest execution results and validation metrics.
    """
    __tablename__ = "backtest_runs"

    backtest_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    methodology = Column(String(32), nullable=False)
    reference_source = Column(String(64), nullable=False)
    booking_horizon = Column(String(4), nullable=False)
    route_id = Column(String(7), nullable=True) # None means national
    data_mode = Column(SQLEnum(DataMode), nullable=False, default=DataMode.LIVE)
    
    sample_count = Column(Integer, nullable=False)
    match_count = Column(Integer, nullable=False)
    coverage_pct = Column(Numeric(5, 2), nullable=False)
    
    mape = Column(Numeric(8, 4), nullable=True)
    rmse = Column(Numeric(8, 4), nullable=True)
    pearson_r = Column(Numeric(8, 4), nullable=True)
    mean_bias_pct = Column(Numeric(8, 4), nullable=True)
    directional_accuracy = Column(Numeric(8, 4), nullable=True)
    
    status = Column(String(32), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
