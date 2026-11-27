"""Tests for healthcheck and OpenAPI schema endpoints."""

import pytest
from django.db import DatabaseError, connection
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_health_endpoint_returns_ok() -> None:
    client = APIClient()
    response = client.get("/api/v1/health/")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


@pytest.mark.django_db
def test_health_endpoint_returns_503_when_database_fails(monkeypatch: pytest.MonkeyPatch) -> None:
    def failing_cursor():
        raise DatabaseError("database unreachable")

    monkeypatch.setattr(connection, "cursor", failing_cursor)

    client = APIClient()
    response = client.get("/api/v1/health/")

    assert response.status_code == 503
    assert response.json() == {"status": "error", "database": "unavailable"}


@pytest.mark.django_db
def test_openapi_schema_endpoint_returns_valid_openapi_3() -> None:
    client = APIClient()
    response = client.get("/api/v1/schema/", HTTP_ACCEPT="application/json")

    assert response.status_code == 200
    schema = response.json()
    assert str(schema.get("openapi", "")).startswith("3.")
    assert schema["info"]["title"] == "Alyp-Satu API"
    assert "/api/v1/health/" in schema["paths"]


@pytest.mark.django_db
def test_swagger_docs_endpoint_returns_200() -> None:
    client = APIClient()
    response = client.get("/api/v1/docs/")

    assert response.status_code == 200
