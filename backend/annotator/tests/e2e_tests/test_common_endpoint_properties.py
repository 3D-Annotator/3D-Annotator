from typing import Any

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from requests import Response

from annotator.tests.conftest import api_client as api_client_function

import json

pytestmark = pytest.mark.django_db


class TestCommonEndpointProperties:
    endpoint = reverse("logout")

    def test_not_authenticated(self, user: User, api_client: api_client_function):
        client = api_client()

        # with invalid auth header
        response: Response = client.post(self.endpoint)
        content_dict: dict[str, Any] = json.loads(response.content)
        error_code = "not_authenticated"

        assert response.status_code == 401
        assert content_dict["code"] == error_code

        # with valid auth header, but invalid token
        client.credentials(HTTP_AUTHORIZATION="Token " + "invalidToken")
        response: Response = client.post(self.endpoint)
        content_dict: dict[str, Any] = json.loads(response.content)
        error_code = "not_logged_in"

        assert response.status_code == 401
        assert content_dict["code"] == error_code
