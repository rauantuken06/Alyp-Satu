"""App configuration for the categories app."""

from django.apps import AppConfig


class CategoriesConfig(AppConfig):
    """Configuration for product categories domain."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "categories"
