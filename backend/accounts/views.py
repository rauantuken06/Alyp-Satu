"""Authentication and current user profile API views."""

from django.contrib.auth import login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.serializers import (
    CsrfResponseSerializer,
    LoginSerializer,
    RegisterSerializer,
    UpdateProfileSerializer,
    UserProfileSerializer,
)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfCookieView(APIView):
    """Ensure the browser/SPA receives a CSRF cookie for subsequent mutating requests."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Issue CSRF cookie",
        description="Sets the csrftoken cookie for session-based browser clients.",
        responses={
            200: OpenApiResponse(
                response=CsrfResponseSerializer,
                description="CSRF cookie set.",
            ),
        },
        tags=["auth"],
    )
    def get(self, request: Request) -> Response:
        return Response({"detail": "CSRF cookie set."}, status=status.HTTP_200_OK)


@method_decorator(csrf_protect, name="dispatch")
class RegisterView(APIView):
    """Register a new unverified user account and start a server-side session."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Register a new user",
        description=(
            "Creates an unverified user account (is_email_verified=False), "
            "starts a server-side session, and returns the user profile."
        ),
        request=RegisterSerializer,
        responses={
            201: OpenApiResponse(
                response=UserProfileSerializer,
                description="User registered and authenticated.",
            ),
            400: OpenApiResponse(description="Validation error."),
            403: OpenApiResponse(description="CSRF verification failed."),
        },
        tags=["auth"],
    )
    def post(self, request: Request) -> Response:
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request._request, user)
        return Response(
            UserProfileSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )


@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    """Authenticate an existing user and establish a server-side session."""

    permission_classes = [AllowAny]

    @extend_schema(
        summary="Log in with email and password",
        description=(
            "Authenticates the user and sets an HttpOnly session cookie. "
            "Returns a generic 400 error on invalid credentials or inactive accounts."
        ),
        request=LoginSerializer,
        responses={
            200: OpenApiResponse(
                response=UserProfileSerializer,
                description="User authenticated.",
            ),
            400: OpenApiResponse(description="Invalid email or password."),
            403: OpenApiResponse(description="CSRF verification failed."),
        },
        tags=["auth"],
    )
    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        login(request._request, user)
        return Response(
            UserProfileSerializer(user).data,
            status=status.HTTP_200_OK,
        )


@method_decorator(csrf_protect, name="dispatch")
class LogoutView(APIView):
    """End the authenticated user's server-side session."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Log out current user",
        description="Flushes the current server-side session.",
        request=None,
        responses={
            204: OpenApiResponse(description="Logged out successfully."),
            403: OpenApiResponse(
                description="Authentication required or CSRF verification failed.",
            ),
        },
        tags=["auth"],
    )
    def post(self, request: Request) -> Response:
        logout(request._request)
        return Response(status=status.HTTP_204_NO_CONTENT)


@method_decorator(csrf_protect, name="dispatch")
class CurrentUserView(APIView):
    """Retrieve or partially update the currently authenticated user's profile."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get current user profile",
        description="Returns the profile of the currently authenticated user.",
        responses={
            200: OpenApiResponse(
                response=UserProfileSerializer,
                description="Current user profile.",
            ),
            403: OpenApiResponse(description="Authentication credentials were not provided."),
        },
        tags=["auth"],
    )
    def get(self, request: Request) -> Response:
        return Response(
            UserProfileSerializer(request.user).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Update current user profile",
        description=(
            "Updates allowed mutable profile fields (full_name only). "
            "Identity and verification fields remain read-only."
        ),
        request=UpdateProfileSerializer,
        responses={
            200: OpenApiResponse(
                response=UserProfileSerializer,
                description="Updated user profile.",
            ),
            400: OpenApiResponse(description="Validation error."),
            403: OpenApiResponse(
                description="Authentication required or CSRF verification failed.",
            ),
        },
        tags=["auth"],
    )
    def patch(self, request: Request) -> Response:
        serializer = UpdateProfileSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            UserProfileSerializer(request.user).data,
            status=status.HTTP_200_OK,
        )
