from app.core.celery_app import health_check_task

def test_celery_health_check_task():
    result = health_check_task()
    assert result["status"] == "ok"
    assert result["task"] == "health_check_task"
    assert "broker" in result
