"""Serializers for authentication and user profile endpoints."""

from typing import Any

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from rest_framework import serializers

User = get_user_model()


class CsrfResponseSerializer(serializers.Serializer):
    """Response payload confirming the CSRF cookie has been set."""

    detail = serializers.CharField(read_only=True)


class UserProfileSerializer(serializers.ModelSerializer):
    """Read-only representation of an authenticated user's profile."""

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "full_name",
            "is_email_verified",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    """Serializer for registering a new unverified user account."""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={"input_type": "password"},
    )
    full_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
        default="",
    )

    def validate_email(self, value: str) -> str:
        normalized_email = User.objects.normalize_email(value)
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return normalized_email

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        candidate_user = User(
            email=attrs["email"],
            full_name=attrs.get("full_name", ""),
        )
        try:
            validate_password(attrs["password"], user=candidate_user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)}) from exc
        return attrs

    def create(self, validated_data: dict[str, Any]) -> Any:
        try:
            return User.objects.create_user(
                email=validated_data["email"],
                password=validated_data["password"],
                full_name=validated_data.get("full_name", ""),
                is_email_verified=False,
            )
        except IntegrityError as exc:
            raise serializers.ValidationError(
                {"email": ["A user with this email already exists."]}
            ) from exc


class LoginSerializer(serializers.Serializer):
    """Serializer for email/password session login."""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={"input_type": "password"},
    )

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        normalized_email = User.objects.normalize_email(attrs["email"])
        request = self.context.get("request")
        django_request = getattr(request, "_request", request)

        user = authenticate(
            request=django_request,
            username=normalized_email,
            password=attrs["password"],
        )
        if user is None:
            raise serializers.ValidationError("Invalid email or password.")

        attrs["user"] = user
        return attrs


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Serializer allowing an authenticated user to update their full_name only."""

    class Meta:
        model = User
        fields = ("full_name",)
