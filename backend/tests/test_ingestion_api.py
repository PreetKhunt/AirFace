def test_historical_fixture_endpoint(client):
    res = client.post("/api/v1/ingestion/fixtures/historical")
    assert res.status_code == 200
    data = res.json()
    assert data["source_name"] == "fixture_historical"
    assert data["collection_mode"] == "HISTORICAL"
    assert data["raw_ingested"] == 450
    assert data["parsed_ingested"] == 450
    assert data["duplicates_skipped"] == 0

    # Query observations endpoint
    obs_res = client.get("/api/v1/observations?page=1&page_size=10")
    assert obs_res.status_code == 200
    obs_data = obs_res.json()
    assert obs_data["total"] == 450
    assert len(obs_data["results"]) == 10

    # Query with filters
    del_bom_res = client.get("/api/v1/observations?origin=DEL&destination=BOM")
    assert del_bom_res.status_code == 200
    del_bom_data = del_bom_res.json()
    assert del_bom_data["total"] > 0
    for item in del_bom_data["results"]:
        assert item["origin"] == "DEL"
        assert item["destination"] == "BOM"

    # Query single observation by id
    first_id = obs_data["results"][0]["observation_id"]
    single_res = client.get(f"/api/v1/observations/{first_id}")
    assert single_res.status_code == 200
    assert single_res.json()["observation_id"] == first_id

    # Sources health endpoint
    sources_res = client.get("/api/v1/sources")
    assert sources_res.status_code == 200
    sources_data = sources_res.json()
    assert sources_data["total"] >= 1

    single_source = client.get("/api/v1/sources/fixture_historical/health")
    assert single_source.status_code == 200
    assert single_source.json()["status"] == "HEALTHY"


def test_synthetic_fixture_endpoint(client):
    res = client.post("/api/v1/ingestion/fixtures/synthetic")
    assert res.status_code == 200
    data = res.json()
    assert data["source_name"] == "fixture_synthetic"
    assert data["collection_mode"] == "SYNTHETIC"
    assert data["raw_ingested"] == 162
    assert data["parsed_ingested"] == 162


def test_observation_not_found(client):
    import uuid
    random_id = str(uuid.uuid4())
    res = client.get(f"/api/v1/observations/{random_id}")
    assert res.status_code == 404
