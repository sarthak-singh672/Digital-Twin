import os
from datetime import datetime, date

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_contract.db")

from fastapi.testclient import TestClient

from src.api.main import app
from src.api import auth
from src.db import database, models


client = TestClient(app)


def _auth_headers(user_id: int) -> dict:
    token = auth.create_access_token(data={"sub": str(user_id)})
    return {"Authorization": f"Bearer {token}"}


def _seed_user() -> tuple[models.User, dict]:
    db = database.SessionLocal()
    try:
        user = models.User(
            email="contract-user@example.com",
            username="contract_user",
            first_name="Contract",
            last_name="User",
            hashed_password=auth.get_password_hash("password123"),
            consent=True,
            theme="ocean"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user, _auth_headers(user.user_id)
    finally:
        db.close()


def setup_function():
    models.Base.metadata.drop_all(bind=database.engine)
    models.Base.metadata.create_all(bind=database.engine)


def test_missing_get_data_endpoints_exist_and_return_results():
    user, headers = _seed_user()
    today = date.today().isoformat()

    for path, payload in [
        ("/api/v1/data/lifestyle", {"date": today, "sleep_hrs": 7.5, "stress_score": 4, "water_glasses": 8, "diet_score": 7}),
        ("/api/v1/data/academic", {"date": today, "study_hrs": 3.0, "attendance_pct": 95, "assignments_on_time": 1}),
        ("/api/v1/data/activity", {"date": today, "steps": 6500, "exercise_mins": 45}),
    ]:
        post_res = client.post(path, headers=headers, json=payload)
        assert post_res.status_code == 200

    for get_path in ["/api/v1/data/lifestyle?limit=30", "/api/v1/data/academic?limit=30", "/api/v1/data/activity?limit=30"]:
        res = client.get(get_path, headers=headers)
        assert res.status_code == 200
        body = res.json()
        assert "results" in body
        assert len(body["results"]) >= 1


def test_put_users_me_updates_profile_fields():
    user, headers = _seed_user()
    res = client.put(
        "/api/v1/users/me",
        headers=headers,
        json={"first_name": "Updated", "theme": "dark"}
    )
    assert res.status_code == 200
    body = res.json()
    assert body["first_name"] == "Updated"
    assert body["theme"] == "dark"


def test_complete_goal_returns_active_count():
    user, headers = _seed_user()
    db = database.SessionLocal()
    try:
        g1 = models.Goal(user_id=user.user_id, date=date.today(), text="Goal 1", completed=False)
        g2 = models.Goal(user_id=user.user_id, date=date.today(), text="Goal 2", completed=False)
        db.add_all([g1, g2])
        db.commit()
        db.refresh(g1)
    finally:
        db.close()

    res = client.put(f"/api/v1/goals/{g1.id}/complete", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "success"
    assert body["active_count"] == 1


def test_profile_stats_contains_required_contract_keys(monkeypatch):
    user, headers = _seed_user()

    monkeypatch.setattr("src.api.main.get_user_data", lambda *_args, **_kwargs: None)

    res = client.get("/api/v1/profile/stats", headers=headers)
    assert res.status_code == 200
    body = res.json()

    for key in [
        "health_score",
        "health_label",
        "risk_score",
        "day_streak",
        "active_goals",
        "total_entries",
        "pending_goals",
        "no_pending",
        "achievements",
        "health_goals",
    ]:
        assert key in body


def test_analytics_summary_contains_required_contract_keys(monkeypatch):
    user, headers = _seed_user()

    monkeypatch.setattr("src.api.main.get_user_data", lambda *_args, **_kwargs: None)

    res = client.get("/api/v1/analytics/summary", headers=headers)
    assert res.status_code == 200
    body = res.json()

    for key in [
        "risk_score",
        "health_score",
        "risk_label",
        "timestamp",
        "vitals",
        "lifestyle",
        "academic",
        "chart_data",
        "recommendations",
    ]:
        assert key in body
