def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "airfare-index-api"
    assert data["version"] == "1.0.0"

def test_system_status_endpoint(client):
    response = client.get("/api/v1/health/system")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "airfare-index-api"
    assert "database_connected" in data
    assert "data_mode" in data
    assert data["data_mode"] is None
