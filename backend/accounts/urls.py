"""URL routing for authentication and current user profile endpoints."""

from django.urls import path

from accounts.views import (
    CsrfCookieView,
    CurrentUserView,
    LoginView,
    LogoutView,
    RegisterView,
)

app_name = "accounts"

urlpatterns = [
    path("csrf/", CsrfCookieView.as_view(), name="auth-csrf"),
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("me/", CurrentUserView.as_view(), name="auth-me"),
]
