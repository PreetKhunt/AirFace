"""
Phase C API & Task Tests -- SIH26056
"""
from unittest.mock import patch
from app.tasks.normalization_tasks import normalize_observations_task
from app.schemas.normalization import PhaseCNormalizationResponse
from decimal import Decimal


def test_normalization_api_endpoints(client):
    ingest_res = client.post("/api/v1/ingestion/fixtures/synthetic")
    assert ingest_res.status_code == 200

    # 2. Trigger normalization run
    norm_res = client.post("/api/v1/normalization/run")
    assert norm_res.status_code == 200
    norm_data = norm_res.json()
    assert norm_data["status"] == "SUCCESS"
    assert norm_data["total_normalized_created"] == 162

    # 3. Query normalized observations
    list_res = client.get("/api/v1/normalized-observations?page=1&page_size=10")
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] == 162
    assert len(list_data["results"]) == 10

    # 4. Filter by route and horizon
    filter_res = client.get("/api/v1/normalized-observations?route_id=DEL-BOM&booking_horizon=T+1")
    assert filter_res.status_code == 200
    filter_data = filter_res.json()
    assert filter_data["total"] > 0
    for r in filter_data["results"]:
        assert r["route_id"] == "DEL-BOM"
        assert r["booking_horizon"] == "T+1"

    # 5. Query single normalized observation by ID
    single_id = list_data["results"][0]["index_obs_id"]
    single_res = client.get(f"/api/v1/normalized-observations/{single_id}")
    assert single_res.status_code == 200
    assert single_res.json()["index_obs_id"] == single_id

    # 6. Query Data Quality API
    dq_res = client.get("/api/v1/quality/score")
    assert dq_res.status_code == 200
    dq_data = dq_res.json()
    assert float(dq_data["dq_score"]) > 0.0

    dq_hist = client.get("/api/v1/quality/history")
    assert dq_hist.status_code == 200
    assert dq_hist.json()["total"] >= 1

    system_status = client.get("/api/v1/health/system").json()
    assert system_status["data_mode"] == "SYNTHETIC"

    horizon_summary = client.get("/api/v1/index/horizons").json()
    assert horizon_summary["data_mode"] == "SYNTHETIC"
    assert [item["horizon"] for item in horizon_summary["horizons"]] == [
        "T+1", "T+7", "T+15", "T+30", "T+45"
    ]
    assert [item["observation_count"] for item in horizon_summary["horizons"]] == [36, 36, 36, 36, 18]
    assert all(item["availability_state"] == "DATA_NOT_AVAILABLE" for item in horizon_summary["horizons"])
    assert all(item["reason"] for item in horizon_summary["horizons"])

    pipeline_status = client.get("/api/v1/pipeline/status").json()
    assert pipeline_status["data_mode"] == "SYNTHETIC"
    assert pipeline_status["counts"]["raw"] == 162
    assert pipeline_status["counts"]["parsed"] == 162
    assert pipeline_status["counts"]["normalized"] == 162
    assert pipeline_status["counts"]["dq"] == 162

    route_weights = client.get("/api/v1/index/weights").json()
    assert len(route_weights["routes"]) == 9
    normalized_weight_total = sum(float(route["normalized_weight_pct"]) for route in route_weights["routes"])
    assert abs(normalized_weight_total - 100) < 0.01

    calculated = client.post(
        "/api/v1/index/calculate",
        params={"calculation_date": "2026-02-28", "base_date": "2026-02-28"},
    )
    assert calculated.status_code == 200
    assert calculated.json()["data_mode"] == "SYNTHETIC"


@patch("app.tasks.normalization_tasks.run_phase_c_normalization")
def test_normalization_celery_task(mock_run_norm):
    mock_run_norm.return_value = PhaseCNormalizationResponse(
        total_parsed_processed=90,
        total_normalized_created=90,
        valid_for_index_count=90,
        commercial_duplicates_count=0,
        outliers_detected_count=0,
        market_surges_count=0,
        imputed_count=0,
        overall_dq_score=Decimal("94.50"),
        status="SUCCESS",
    )
    result = normalize_observations_task()
    assert result["status"] == "SUCCESS"
    assert result["total_normalized_created"] == 90
