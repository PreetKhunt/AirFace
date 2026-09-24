from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.core.enums import DataMode


class BacktestRunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    backtest_id: UUID
    start_date: date
    end_date: date
    methodology: str
    reference_source: str
    booking_horizon: str
    route_id: Optional[str]
    data_mode: DataMode
    sample_count: int
    match_count: int
    coverage_pct: Decimal
    mape: Optional[Decimal]
    rmse: Optional[Decimal]
    pearson_r: Optional[Decimal]
    mean_bias_pct: Optional[Decimal]
    directional_accuracy: Optional[Decimal]
    status: str
    created_at: Optional[datetime]
