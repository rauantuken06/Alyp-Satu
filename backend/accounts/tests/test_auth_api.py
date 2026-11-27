"""Tests for Sprint 01 authentication and current user profile endpoints."""

import uuid

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.mark.django_db
def test_csrf_endpoint_sets_cookie() -> None:
    client = APIClient()
    response = client.get("/api/v1/auth/csrf/")

    assert response.status_code == 200
    assert response.json() == {"detail": "CSRF cookie set."}
    assert "csrftoken" in response.cookies
    assert response.cookies["csrftoken"].value


@pytest.mark.django_db
def test_register_happy_path_creates_unverified_user_and_logs_in() -> None:
    client = APIClient()
    response = client.post(
        "/api/v1/auth/register/",
        data={
            "email": "  New.Seller@Example.COM ",
            "password": "StrongPassword123!",
            "full_name": "Nurlan Sadykov",
        },
        format="json",
    )

    assert response.status_code == 201
    payload = response.json()
    assert uuid.UUID(payload["id"])
    assert payload["email"] == "new.seller@example.com"
    assert payload["full_name"] == "Nurlan Sadykov"
    assert payload["is_email_verified"] is False
    assert "created_at" in payload
    assert "updated_at" in payload
    assert "password" not in payload
    assert "sessionid" in response.cookies
    assert response.cookies["sessionid"]["httponly"] is True

    me_response = client.get("/api/v1/auth/me/")
    assert me_response.status_code == 200
    assert me_response.json()["id"] == payload["id"]
    assert me_response.json()["email"] == "new.seller@example.com"


@pytest.mark.django_db
def test_register_rejects_weak_password() -> None:
    client = APIClient()
    response = client.post(
        "/api/v1/auth/register/",
        data={
            "email": "weak@example.com",
            "password": "123",
        },
        format="json",
    )

    assert response.status_code == 400
    assert "password" in response.json()
    assert not User.objects.filter(email="weak@example.com").exists()


@pytest.mark.django_db
def test_register_rejects_case_insensitive_duplicate_email() -> None:
    User.objects.create_user(
        email="User@Example.com",
        password="StrongPassword123!",
    )

    client = APIClient()
    response = client.post(
        "/api/v1/auth/register/",
        data={
            "email": "user@example.com",
            "password": "AnotherStrongPassword123!",
        },
        format="json",
    )

    assert response.status_code == 400
    assert "email" in response.json()
    assert User.objects.count() == 1


@pytest.mark.django_db
def test_register_ignores_privileged_and_verification_fields() -> None:
    client = APIClient()
    response = client.post(
        "/api/v1/auth/register/",
        data={
            "email": "attempt@example.com",
            "password": "StrongPassword123!",
            "full_name": "Regular User",
            "is_email_verified": True,
            "is_staff": True,
            "is_superuser": True,
        },
        format="json",
    )

    assert response.status_code == 201
    user = User.objects.get(email="attempt@example.com")
    assert user.is_email_verified is False
    assert user.is_staff is False
    assert user.is_superuser is False
    assert response.json()["is_email_verified"] is False


@pytest.mark.django_db
def test_login_happy_path_is_case_insensitive_and_sets_session_cookie() -> None:
    user = User.objects.create_user(
        email="buyer@example.com",
        password="StrongPassword123!",
        full_name="Dana Alimova",
    )

    client = APIClient()
    response = client.post(
        "/api/v1/auth/login/",
        data={
            "email": "BUYER@Example.COM",
            "password": "StrongPassword123!",
        },
        format="json",
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == str(user.id)
    assert payload["email"] == "buyer@example.com"
    assert payload["full_name"] == "Dana Alimova"
    assert payload["is_email_verified"] is False
    assert "sessionid" in response.cookies
    assert response.cookies["sessionid"]["httponly"] is True


@pytest.mark.django_db
def test_login_invalid_credentials_and_nonexistent_email_return_same_generic_error() -> None:
    User.objects.create_user(
        email="exists@example.com",
        password="StrongPassword123!",
    )
    User.objects.create_user(
        email="inactive@example.com",
        password="StrongPassword123!",
        is_active=False,
    )

    client = APIClient()
    wrong_password = client.post(
        "/api/v1/auth/login/",
        data={"email": "exists@example.com", "password": "WrongPassword999!"},
        format="json",
    )
    unknown_email = client.post(
        "/api/v1/auth/login/",
        data={"email": "missing@example.com", "password": "StrongPassword123!"},
        format="json",
    )
    inactive_user = client.post(
        "/api/v1/auth/login/",
        data={"email": "inactive@example.com", "password": "StrongPassword123!"},
        format="json",
    )

    assert wrong_password.status_code == 400
    assert unknown_email.status_code == 400
    assert inactive_user.status_code == 400
    assert wrong_password.json() == unknown_email.json() == inactive_user.json()
    assert wrong_password.json() == {"non_field_errors": ["Invalid email or password."]}


@pytest.mark.django_db
def test_logout_flushes_session() -> None:
    User.objects.create_user(
        email="logout@example.com",
        password="StrongPassword123!",
    )

    client = APIClient()
    login_response = client.post(
        "/api/v1/auth/login/",
        data={"email": "logout@example.com", "password": "StrongPassword123!"},
        format="json",
    )
    assert login_response.status_code == 200

    logout_response = client.post("/api/v1/auth/logout/")
    assert logout_response.status_code == 204

    me_response = client.get("/api/v1/auth/me/")
    assert me_response.status_code == 403


@pytest.mark.django_db
def test_logout_requires_authentication() -> None:
    client = APIClient()
    response = client.post("/api/v1/auth/logout/")

    assert response.status_code == 403


@pytest.mark.django_db
def test_me_requires_authentication_and_returns_profile_when_authenticated() -> None:
    user = User.objects.create_user(
        email="profile@example.com",
        password="StrongPassword123!",
        full_name="Aigerim Toleu",
    )

    client = APIClient()
    unauth_response = client.get("/api/v1/auth/me/")
    assert unauth_response.status_code == 403

    client.force_authenticate(user=user)
    auth_response = client.get("/api/v1/auth/me/")
    assert auth_response.status_code == 200
    assert auth_response.json()["id"] == str(user.id)
    assert auth_response.json()["email"] == "profile@example.com"
    assert auth_response.json()["full_name"] == "Aigerim Toleu"
    assert auth_response.json()["is_email_verified"] is False


@pytest.mark.django_db
def test_me_patch_updates_only_full_name() -> None:
    user = User.objects.create_user(
        email="editable@example.com",
        password="StrongPassword123!",
        full_name="Old Name",
    )

    client = APIClient()
    login_response = client.post(
        "/api/v1/auth/login/",
        data={"email": "editable@example.com", "password": "StrongPassword123!"},
        format="json",
    )
    assert login_response.status_code == 200

    patch_response = client.patch(
        "/api/v1/auth/me/",
        data={
            "full_name": "Updated Name",
            "email": "hijacked@example.com",
            "is_email_verified": True,
            "is_staff": True,
        },
        format="json",
    )

    assert patch_response.status_code == 200
    payload = patch_response.json()
    assert payload["full_name"] == "Updated Name"
    assert payload["email"] == "editable@example.com"
    assert payload["is_email_verified"] is False

    user.refresh_from_db()
    assert user.full_name == "Updated Name"
    assert user.email == "editable@example.com"
    assert user.is_email_verified is False
    assert user.is_staff is False


@pytest.mark.django_db
def test_csrf_enforced_on_mutating_auth_endpoints() -> None:
    User.objects.create_user(
        email="csrf@example.com",
        password="StrongPassword123!",
    )

    client = APIClient(enforce_csrf_checks=True)

    # Without CSRF token, register and login must fail with 403
    no_csrf_register = client.post(
        "/api/v1/auth/register/",
        data={"email": "newcsrf@example.com", "password": "StrongPassword123!"},
        format="json",
    )
    assert no_csrf_register.status_code == 403

    no_csrf_login = client.post(
        "/api/v1/auth/login/",
        data={"email": "csrf@example.com", "password": "StrongPassword123!"},
        format="json",
    )
    assert no_csrf_login.status_code == 403

    # Fetch CSRF cookie
    csrf_response = client.get("/api/v1/auth/csrf/")
    assert csrf_response.status_code == 200
    csrf_token = csrf_response.cookies["csrftoken"].value

    # Login succeeds with valid X-CSRFToken header
    login_response = client.post(
        "/api/v1/auth/login/",
        data={"email": "csrf@example.com", "password": "StrongPassword123!"},
        format="json",
        HTTP_X_CSRFTOKEN=csrf_token,
    )
    assert login_response.status_code == 200

    # Session login rotates the CSRF token; use the updated cookie for subsequent mutations
    rotated_csrf_token = login_response.cookies["csrftoken"].value

    # PATCH /me/ without CSRF fails with 403; with rotated CSRF succeeds
    no_csrf_patch = client.patch(
        "/api/v1/auth/me/",
        data={"full_name": "Blocked Name"},
        format="json",
    )
    assert no_csrf_patch.status_code == 403

    patch_response = client.patch(
        "/api/v1/auth/me/",
        data={"full_name": "Allowed Name"},
        format="json",
        HTTP_X_CSRFTOKEN=rotated_csrf_token,
    )
    assert patch_response.status_code == 200
    assert patch_response.json()["full_name"] == "Allowed Name"

    # Logout without CSRF fails with 403; with rotated CSRF succeeds
    no_csrf_logout = client.post("/api/v1/auth/logout/")
    assert no_csrf_logout.status_code == 403

    logout_response = client.post(
        "/api/v1/auth/logout/",
        HTTP_X_CSRFTOKEN=rotated_csrf_token,
    )
    assert logout_response.status_code == 204


@pytest.mark.django_db
def test_register_succeeds_from_vite_dev_origin_with_csrf_token() -> None:
    client = APIClient(enforce_csrf_checks=True)

    csrf_response = client.get(
        "/api/v1/auth/csrf/",
        HTTP_HOST="localhost:8000",
        HTTP_ORIGIN="http://localhost:5173",
    )
    assert csrf_response.status_code == 200
    assert csrf_response.cookies["csrftoken"]["httponly"] == ""
    csrf_token = csrf_response.cookies["csrftoken"].value

    register_response = client.post(
        "/api/v1/auth/register/",
        data={
            "email": "vite.user@example.com",
            "password": "StrongPassword123!",
            "full_name": "Vite Proxy User",
        },
        format="json",
        HTTP_HOST="localhost:8000",
        HTTP_ORIGIN="http://localhost:5173",
        HTTP_X_CSRFTOKEN=csrf_token,
    )

    assert register_response.status_code == 201
    assert register_response.json()["email"] == "vite.user@example.com"
    assert "sessionid" in register_response.cookies
    assert register_response.cookies["sessionid"]["httponly"] is True
