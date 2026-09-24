from app.services.demo_reference import load_demo_reference_baseline, REFERENCE_SOURCE


def test_demo_validation_pipeline_produces_full_metrics(client):
    first_ingest = client.post("/api/v1/ingestion/fixtures/historical-validation")
    assert first_ingest.status_code == 200
    assert first_ingest.json()["parsed_ingested"] == 31

    second_ingest = client.post("/api/v1/ingestion/fixtures/historical-validation")
    assert second_ingest.status_code == 200
    assert second_ingest.json()["duplicates_skipped"] == 31

    normalization = client.post("/api/v1/normalization/run")
    assert normalization.status_code == 200

    reference_data = load_demo_reference_baseline()
    for observation_date in reference_data:
        response = client.post(
            "/api/v1/index/calculate",
            params={
                "calculation_date": observation_date.isoformat(),
                "base_date": "2026-01-14",
                "data_mode": "HISTORICAL",
            },
        )
        assert response.status_code == 200

    backtest = client.post(
        "/api/v1/backtest/run",
        json={
            "start_date": "2026-01-15",
            "end_date": "2026-02-13",
            "reference_data": {str(key): value for key, value in reference_data.items()},
            "reference_source": REFERENCE_SOURCE,
            "methodology": "JEVONS",
            "booking_horizon": "T+1",
            "data_mode": "HISTORICAL",
        },
    )

    assert backtest.status_code == 200
    result = backtest.json()
    assert result["status"] == "VALIDATED"
    assert result["sample_count"] == 30
    assert result["match_count"] == 30
    assert result["coverage_pct"] == "100.00"
    assert result["mape"] is not None
    assert result["rmse"] is not None
    assert result["pearson_r"] is not None
    assert result["mean_bias_pct"] is not None
    assert result["directional_accuracy"] is not None
