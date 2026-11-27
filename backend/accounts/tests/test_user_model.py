"""Tests for the custom User model and UserManager."""

import uuid

import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError

User = get_user_model()


@pytest.mark.django_db
def test_create_regular_user() -> None:
    user = User.objects.create_user(
        email="  Buyer.One@Example.COM ",
        password="StrongPassword123!",
        full_name="Aruzhan Bekova",
    )

    assert isinstance(user.id, uuid.UUID)
    assert user.email == "buyer.one@example.com"
    assert user.full_name == "Aruzhan Bekova"
    assert user.check_password("StrongPassword123!") is True
    assert user.is_email_verified is False
    assert user.is_active is True
    assert user.is_staff is False
    assert user.is_superuser is False
    assert user.created_at is not None
    assert user.updated_at is not None


@pytest.mark.django_db
def test_create_superuser() -> None:
    superuser = User.objects.create_superuser(
        email="Admin@Example.COM",
        password="AdminPassword123!",
    )

    assert isinstance(superuser.id, uuid.UUID)
    assert superuser.email == "admin@example.com"
    assert superuser.check_password("AdminPassword123!") is True
    assert superuser.is_email_verified is False
    assert superuser.is_active is True
    assert superuser.is_staff is True
    assert superuser.is_superuser is True


@pytest.mark.django_db
def test_email_uniqueness_is_case_insensitive_and_normalized() -> None:
    User.objects.create_user(email="User@Example.com", password="Password123!")

    with pytest.raises(IntegrityError):
        User.objects.create_user(email="USER@EXAMPLE.COM", password="Password456!")


@pytest.mark.django_db
def test_create_user_requires_email() -> None:
    with pytest.raises(ValueError, match="Email"):
        User.objects.create_user(email="   ", password="Password123!")
