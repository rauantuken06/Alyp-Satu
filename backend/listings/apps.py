"""App configuration for the listings app."""

from django.apps import AppConfig


class ListingsConfig(AppConfig):
    """Configuration for marketplace listings domain."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "listings"
