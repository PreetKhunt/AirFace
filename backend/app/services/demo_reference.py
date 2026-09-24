"""Loader for the version-controlled demo reference baseline fixture."""

import csv
from datetime import date
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
REFERENCE_FIXTURE_PATH = PROJECT_ROOT / "data" / "fixtures" / "reference" / "demo_reference_baseline.csv"
REFERENCE_SOURCE = "MOCK_BASELINE"
REFERENCE_TYPE = "DEMO_SYNTHETIC"


def load_demo_reference_baseline() -> dict[date, float]:
    """Return the validated date/value series used by the demo backtest."""
    values: dict[date, float] = {}
    with REFERENCE_FIXTURE_PATH.open(newline="", encoding="utf-8") as fixture:
        for row in csv.DictReader(fixture):
            if row["source"] != REFERENCE_SOURCE or row["reference_type"] != REFERENCE_TYPE:
                raise ValueError("Demo reference fixture metadata is invalid")
            if row["methodology"] != "JEVONS" or row["data_mode"] != "SYNTHETIC":
                raise ValueError("Demo reference fixture methodology or mode is invalid")
            observation_date = date.fromisoformat(row["reference_date"])
            if observation_date in values:
                raise ValueError(f"Duplicate demo reference date: {observation_date}")
            value = float(row["reference_index"])
            if value <= 0:
                raise ValueError(f"Demo reference value must be positive: {observation_date}")
            values[observation_date] = value

    if len(values) < 30:
        raise ValueError("Demo reference fixture must contain at least 30 observations")
    return values