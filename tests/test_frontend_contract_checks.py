from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_api_client_exposes_required_methods():
    api_js = (ROOT / "frontend" / "js" / "api.js").read_text(encoding="utf-8")
    for method_name in [
        "getProfileStats",
        "getActivity",
        "updateProfile",
        "completeGoal",
        "getAnalyticsSummary",
    ]:
        assert f"{method_name}(" in api_js


def test_profile_and_analytics_use_canonical_api_client():
    profile_html = (ROOT / "frontend" / "profile.html").read_text(encoding="utf-8")
    analytics_html = (ROOT / "frontend" / "analytics.html").read_text(encoding="utf-8")

    assert "const apiClient = window.DigitalTwinAPI;" in profile_html
    assert "const apiClient = window.DigitalTwinAPI;" in analytics_html
    assert "API_BASE" not in profile_html
    assert "API_BASE" not in analytics_html
