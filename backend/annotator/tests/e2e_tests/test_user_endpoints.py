from typing import Any

import pytest
from django.urls import reverse
from requests import Response

from annotator.tests.conftest import api_client as api_client_function
from annotator.tests import factories
import json

pytestmark = pytest.mark.django_db


class TestUserEndpoint:
    endpoint = reverse("user-list")

    def test_list(
        self, api_client: api_client_function, user_factory: factories.UserFactory
    ):
        users = user_factory.create_batch(3)

        client = api_client()
        client.force_authenticate(users[0])
        response: Response = client.get(self.endpoint)

        assert response.status_code == 200
        assert len(json.loads(response.content)) == 3

    def test_retrieve(
        self, api_client: api_client_function, user_factory: factories.UserFactory
    ):
        user = user_factory.create()

        url = f"{self.endpoint}{user.pk}/"
        client = api_client()
        client.force_authenticate(user)
        response: Response = client.get(url)
        content_dict: dict[str, Any] = json.loads(response.content)

        assert response.status_code == 200
        assert content_dict["username"] == user.username
        assert content_dict["email"] == user.email
        assert content_dict["user_id"] == user.pk
