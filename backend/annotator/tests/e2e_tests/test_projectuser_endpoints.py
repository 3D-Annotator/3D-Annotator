from typing import Any


from annotator.backend.models import Project


import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from requests import Response

from annotator.tests.conftest import api_client as api_client_function
from annotator.tests import factories
import json


pytestmark = pytest.mark.django_db


class TestProjectUserEndpoint:
    def test_list(
        self,
        project: Project,
        api_client: api_client_function,
        user_factory: factories.UserFactory,
    ):
        endpoint = reverse("projectuser-list", kwargs={"project_id": project.id})
        assert project.users.count() == 0

        users: list[User] = user_factory.create_batch(5)
        for user in users:
            project.users.add(user)
        project.refresh_from_db()

        assert project.users.count() == 5

        client = api_client()
        client.force_authenticate(project.owner)
        response: Response = client.get(endpoint)

        assert response.status_code == 200
        assert len(json.loads(response.content)) == 5

    def test_create(
        self,
        project: Project,
        api_client: api_client_function,
        user_factory: factories.UserFactory,
    ):
        endpoint = reverse("projectuser-list", kwargs={"project_id": project.id})
        user = user_factory.create()
        expected_json = {"user_id": user.pk}

        client = api_client()
        client.force_authenticate(project.owner)
        response: Response = client.post(endpoint, data=expected_json)
        content_dict: dict[str, Any] = json.loads(response.content)
        expected_json["username"] = user.username

        assert response.status_code == 201
        assert content_dict == expected_json

        project.refresh_from_db()
        assert project.users.filter(pk=user.pk).exists()

    def test_delete(
        self,
        project: Project,
        api_client: api_client_function,
        user_factory: factories.UserFactory,
    ):
        endpoint = reverse("projectuser-list", kwargs={"project_id": project.id})
        assert project.users.count() == 0

        users: list[User] = user_factory.create_batch(5)
        for user in users:
            project.users.add(user)
        project.refresh_from_db()

        assert project.users.count() == 5

        # check if owner can delete users
        url = f"{endpoint}{users[0].pk}/"
        client = api_client()
        client.force_authenticate(project.owner)
        response: Response = client.delete(url)

        assert response.status_code == 204

        project.refresh_from_db()
        assert project.users.count() == 4
        assert not project.users.filter(pk=users[0].pk).exists()

        # check if user cannot delete other user
        user1 = users[1]
        user2 = users[2]
        assert user1 != project.owner
        url = f"{endpoint}{user2.pk}/"
        client = api_client()
        client.force_authenticate(user1)
        response: Response = client.delete(url)
        content_dict: dict[str, Any] = json.loads(response.content)

        assert response.status_code == 403
        assert content_dict["code"] == "missing_permission"

        project.refresh_from_db()
        assert project.users.count() == 4

        # check if user can delete himself
        url = f"{endpoint}{user1.pk}/"
        client = api_client()
        client.force_authenticate(user1)
        response: Response = client.delete(url)

        assert response.status_code == 204

        project.refresh_from_db()
        assert project.users.count() == 3
        assert not project.users.filter(pk=user1.pk).exists()

        # check if owner can delete himself
        url = f"{endpoint}{project.owner.pk}/"
        client = api_client()
        client.force_authenticate(project.owner)
        response: Response = client.delete(url)

        assert response.status_code == 404

        project.refresh_from_db()
        assert project.users.count() == 3
        assert project.owner is not None
