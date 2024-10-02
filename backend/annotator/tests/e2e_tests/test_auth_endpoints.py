import datetime
from typing import Any, cast

from knox.models import User as KnoxUser

from annotator.backend.views import LoginView

import base64

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from requests import Response

from annotator.tests.conftest import api_client as api_client_function
from annotator.tests import factories
import json

pytestmark = pytest.mark.django_db


class TestRegisterEndpoint:
    endpoint = reverse("register")

    def test_valid_user(
        self, api_client: api_client_function, user_factory: factories.UserFactory
    ) -> None:
        user: User = user_factory.build()
        expected_json = {
            "username": user.username,
            "email": user.email,
            "password": user.password,
        }
        response: Response = api_client().post(self.endpoint, data=expected_json)
        content_dict: dict[str, Any] = json.loads(response.content)

        assert response.status_code == 200
        assert content_dict["username"] == expected_json["username"]

    @pytest.mark.parametrize("user__username", [""])
    def test_invalid_user(self, user: User, api_client: api_client_function):
        expected_json = {
            "username": user.username,
            "email": user.email,
            "password": user.password,
        }
        response: Response = api_client().post(self.endpoint, data=expected_json)
        content_dict: dict[str, Any] = json.loads(response.content)
        error_code = "validation_errors"

        assert response.status_code == 400
        assert content_dict["code"] == error_code


class TestLoginEndpoint:
    endpoint = reverse("login")

    def test_valid_login(self, user: User, api_client: api_client_function):
        creds_bytes = bytes(f"{user.username}:{user.raw_password}", "utf-8")
        valid_creds = base64.b64encode(creds_bytes).decode("utf-8")
        client = api_client()
        client.credentials(HTTP_AUTHORIZATION="Basic " + valid_creds)

        response: Response = client.post(self.endpoint)

        assert response.status_code == 200

        user = cast(KnoxUser, user)
        tokens = user.auth_token_set.all()

        assert tokens.count() == 1

        expiry: datetime.datetime = tokens[0].expiry
        content_dict: dict[str, Any] = json.loads(response.content)

        assert content_dict["expiry"] == LoginView().format_expiry_datetime(expiry)

        # test again if a new token is generated and old one removed
        client.credentials(HTTP_AUTHORIZATION="Basic " + valid_creds)
        response: Response = client.post(self.endpoint)
        tokens = user.auth_token_set.all()

        assert tokens.count() == 1

        old_expiry = expiry
        expiry: datetime.datetime = tokens[0].expiry
        content_dict: dict[str, Any] = json.loads(response.content)

        assert content_dict["expiry"] == LoginView().format_expiry_datetime(expiry)
        # old token != new token
        assert content_dict["expiry"] != LoginView().format_expiry_datetime(old_expiry)

    def test_invalid_login(self, user: User, api_client: api_client_function):
        client = api_client()

        # with invalid auth header
        client.credentials(HTTP_AUTHORIZATION="Basic")
        response: Response = client.post(self.endpoint)
        content_dict: dict[str, Any] = json.loads(response.content)
        error_code = "authentication_failed"

        assert response.status_code == 401
        assert content_dict["code"] == error_code

        # with valid auth header, but invalid password
        creds_bytes = bytes(f"{user.username}:{user.raw_password}invalid", "utf-8")
        valid_creds = base64.b64encode(creds_bytes).decode("utf-8")
        client.credentials(HTTP_AUTHORIZATION="Basic " + valid_creds)
        response: Response = client.post(self.endpoint)
        content_dict: dict[str, Any] = json.loads(response.content)
        error_code = "invalid_credentials"

        assert response.status_code == 401
        assert content_dict["code"] == error_code


class TestLogoutEndpoint:
    endpoint = reverse("logout")

    def test_logout(self, user: User, api_client: api_client_function):
        # first login
        creds_bytes = bytes(f"{user.username}:{user.raw_password}", "utf-8")
        valid_creds = base64.b64encode(creds_bytes).decode("utf-8")
        client = api_client()
        client.credentials(HTTP_AUTHORIZATION="Basic " + valid_creds)
        response: Response = client.post(reverse("login"))
        assert response.status_code == 200

        user = cast(KnoxUser, user)
        tokens = user.auth_token_set.all()
        assert tokens.count() == 1

        content_dict: dict[str, Any] = json.loads(response.content)
        client.credentials(HTTP_AUTHORIZATION="Token " + content_dict["token"])
        response: Response = client.post(self.endpoint)

        assert response.status_code == 204

        tokens = user.auth_token_set.all()
        # token deleted
        assert tokens.count() == 0
