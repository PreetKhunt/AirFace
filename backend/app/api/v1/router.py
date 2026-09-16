from fastapi import APIRouter
from app.api.v1 import (
    health,
    ingestion,
    observations,
    sources,
    normalization,
    data_quality,
    index,
    backtest,
)

api_router = APIRouter()

# Include routers
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(ingestion.router, tags=["Ingestion"])
api_router.include_router(observations.router, tags=["Observations"])
api_router.include_router(sources.router, tags=["Sources"])
api_router.include_router(normalization.router, tags=["Normalization"])
api_router.include_router(data_quality.router, tags=["Data Quality"])
api_router.include_router(index.router, prefix="/index", tags=["Index Engine"])
api_router.include_router(backtest.router, prefix="/backtest", tags=["Backtesting"])
