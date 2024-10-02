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


class TestProjectEndpoints:
    endpoint = reverse("project-list")

    def test_list(
        self,
        user: User,
        api_client: api_client_function,
        project_factory: factories.ProjectFactory,
    ):
        project_factory.create_batch(3, owner=user)

        url = f"{self.endpoint}?user_id={user.pk}"
        client = api_client()
        client.force_authenticate(user)
        response: Response = client.get(url)

        assert response.status_code == 200
        assert len(json.loads(response.content)) == 3

    def test_create(
        self,
        user: User,
        api_client: api_client_function,
        project_factory: factories.ProjectFactory,
    ):
        project = project_factory.build()
        expected_json = {"name": project.name, "description": project.description}

        client = api_client()
        client.force_authenticate(user)
        response: Response = client.post(self.endpoint, data=expected_json)
        content_dict: dict[str, Any] = json.loads(response.content)

        assert response.status_code == 201
        assert content_dict["name"] == expected_json["name"]
        assert content_dict["description"] == expected_json["description"]
        assert content_dict["owner"]["user_id"] == user.pk

    def test_retrieve(
        self,
        user: User,
        api_client: api_client_function,
        project_factory: factories.ProjectFactory,
    ):
        project = project_factory.create(owner=user)

        url = f"{self.endpoint}{project.pk}/"
        client = api_client()
        client.force_authenticate(user)
        response: Response = client.get(url)
        content_dict: dict[str, Any] = json.loads(response.content)

        assert response.status_code == 200
        assert content_dict["name"] == project.name
        assert content_dict["description"] == project.description
        assert content_dict["owner"]["user_id"] == user.pk

    def test_update(
        self,
        user: User,
        api_client: api_client_function,
        project_factory: factories.ProjectFactory,
    ):
        old_project = project_factory.create(owner=user)
        new_project = project_factory.build()
        expected_json = {
            "name": new_project.name,
            "description": new_project.description,
        }

        url = f"{self.endpoint}{old_project.pk}/"
        client = api_client()
        client.force_authenticate(user)
        response: Response = client.put(url, data=expected_json)
        content_dict: dict[str, Any] = json.loads(response.content)

        assert response.status_code == 200
        assert content_dict["name"] == new_project.name
        assert content_dict["description"] == new_project.description

    def test_delete(self, project: Project, api_client: api_client_function):
        assert Project.objects.all()[0] == project

        url = f"{self.endpoint}{project.pk}/"
        client = api_client()
        client.force_authenticate(project.owner)
        response: Response = client.delete(url)

        assert response.status_code == 204
        assert Project.objects.all().count() == 0

    def test_invalid_list(
        self,
        user: User,
        api_client: api_client_function,
        project_factory: factories.ProjectFactory,
    ):
        project_factory.create_batch(3, owner=user)

        url = f"{self.endpoint}"
        client = api_client()
        client.force_authenticate(user)
        response: Response = client.get(url)
        content_dict: dict[str, Any] = json.loads(response.content)

        assert response.status_code == 403
        assert content_dict["code"] == "missing_permission"

        url = f"{self.endpoint}?user_id=0"
        response: Response = client.get(url)
        content_dict: dict[str, Any] = json.loads(response.content)

        assert response.status_code == 403
        assert content_dict["code"] == "missing_permission"
