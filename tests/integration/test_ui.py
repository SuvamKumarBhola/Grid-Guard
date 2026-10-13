import pytest
from fastapi.testclient import TestClient
from app.main import app


def test_ui_root_redirect():
    with TestClient(app) as tc:
        resp = tc.get("/", follow_redirects=False)
        assert resp.status_code in [307, 302]
        assert resp.headers["location"] == "/ui/"


def test_ui_static_assets_served():
    with TestClient(app) as tc:
        # Check index.html
        resp_html = tc.get("/ui/")
        assert resp_html.status_code == 200
        content = resp_html.text
        assert "GridGuard" in content
        assert "Operator Advisory Only" in content
        assert "asset-table" in content
        assert "sim-form" in content

        # Check styles.css
        resp_css = tc.get("/ui/styles.css")
        assert resp_css.status_code == 200
        assert "Outfit" in resp_css.text

        # Check app.js
        resp_js = tc.get("/ui/app.js")
        assert resp_js.status_code == 200
        assert "initDashboard" in resp_js.text
