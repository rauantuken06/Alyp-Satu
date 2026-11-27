"""Core system views for the Alyp-Satu backend."""

from django.db import DatabaseError, connection
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

HealthCheckResponseSerializer = inline_serializer(
    name="HealthCheckResponse",
    fields={
        "status": serializers.CharField(),
        "database": serializers.CharField(),
    },
)


class HealthCheckView(APIView):
    """Public healthcheck verifying application and database connectivity."""

    authentication_classes: list = []
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Health check",
        description="Verifies API availability and database connectivity.",
        responses={
            200: OpenApiResponse(
                response=HealthCheckResponseSerializer,
                description="Service and database are healthy.",
            ),
            503: OpenApiResponse(
                response=HealthCheckResponseSerializer,
                description="Database is unreachable.",
            ),
        },
        tags=["system"],
    )
    def get(self, request: Request) -> Response:
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except DatabaseError:
            return Response(
                {"status": "error", "database": "unavailable"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {"status": "ok", "database": "ok"},
            status=status.HTTP_200_OK,
        )
