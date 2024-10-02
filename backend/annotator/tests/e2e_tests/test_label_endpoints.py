from typing import Any

from annotator.backend.models import Project, Label

import pytest
from django.urls import reverse
from requests import Response

from annotator.tests.conftest import api_client as api_client_function
from annotator.tests import factories
import json

pytestmark = pytest.mark.django_db


class TestLabelEndpoint:
    endpoint = reverse("label-list")

    def test_list(
        self,
        project: Project,
        api_client: api_client_function,
        label_factory: factories.LabelFactory,
        project_factory: factories.ProjectFactory,
    ):
        label_factory.create_batch(4, project=project)
        project2 = project_factory.create(owner=project.owner)
        label_factory.create_batch(2, project=project2)

        assert Label.objects.all().count() == 6

        url = f"{self.endpoint}?project_id={project.pk}"
        client = api_client()
        client.force_authenticate(project.owner)
        response: Response = client.get(url)

        assert response.status_code == 200
        assert len(json.loads(response.content)) == 4

        url = f"{self.endpoint}?project_id={project2.pk}"
        response: Response = client.get(url)

        assert response.status_code == 200
        assert len(json.loads(response.content)) == 2

        url = f"{self.endpoint}?user_id={project.owner.pk}"
        response: Response = client.get(url)

        assert response.status_code == 200
        assert len(json.loads(response.content)) == 6

    def test_create(
        self,
        project: Project,
        api_client: api_client_function,
        label_factory: factories.LabelFactory,
    ):
        label = label_factory.build()
        expected_json = {
            "name": label.name,
            "annotationClass": label.annotationClass,
            "color": label.color,
            "project_id": project.pk,
        }

        client = api_client()
        client.force_authenticate(project.owner)
        response: Response = client.post(self.endpoint, data=expected_json)
        content_dict: dict[str, Any] = json.loads(response.content)

        assert response.status_code == 201
        assert content_dict["name"] == expected_json["name"]
        assert content_dict["annotationClass"] == expected_json["annotationClass"]
        assert content_dict["color"] == expected_json["color"]

    def test_retrieve(self, label: Label, api_client: api_client_function):
        url = f"{self.endpoint}{label.pk}/"

        client = api_client()
        client.force_authenticate(label.project.owner)
        response: Response = client.get(url)
        content_dict: dict[str, Any] = json.loads(response.content)

        assert response.status_code == 200
        assert content_dict["label_id"] == label.pk
        assert content_dict["name"] == label.name
        assert content_dict["color"] == label.color
        assert content_dict["annotationClass"] == label.annotationClass

    def test_update(
        self,
        project: Project,
        api_client: api_client_function,
        label_factory: factories.LabelFactory,
    ):
        old_label = label_factory.create(project=project)
        new_label = label_factory.build()
        expected_json = {
            "name": new_label.name,
            "color": new_label.color,
        }

        url = f"{self.endpoint}{old_label.pk}/"
        client = api_client()
        client.force_authenticate(project.owner)
        response: Response = client.put(url, data=expected_json)
        content_dict: dict[str, Any] = json.loads(response.content)

        assert response.status_code == 200
        assert content_dict["name"] == new_label.name
        assert content_dict["color"] == new_label.color

    def test_delete(self, label: Label, api_client: api_client_function):
        assert Label.objects.all()[0] == label

        url = f"{self.endpoint}{label.pk}/"
        client = api_client()
        client.force_authenticate(label.project.owner)
        response: Response = client.delete(url)

        assert response.status_code == 204
        assert Label.objects.all().count() == 0

    def test_invalid_list(
        self,
        project: Project,
        api_client: api_client_function,
        label_factory: factories.LabelFactory,
        project_factory: factories.ProjectFactory,
        user_factory: factories.UserFactory,
    ):
        label_factory.create_batch(4, project=project)

        assert Label.objects.all().count() == 4

        # check with no parameters
        url = f"{self.endpoint}"
        client = api_client()
        client.force_authenticate(project.owner)
        response: Response = client.get(url)
        content_dict: dict[str, Any] = json.loads(response.content)

        assert response.status_code == 403
        assert content_dict["code"] == "missing_permission"

        # check wrong user_id
        url = f"{self.endpoint}?user_id=0"
        response: Response = client.get(url)
        content_dict: dict[str, Any] = json.loads(response.content)

        assert response.status_code == 403
        assert content_dict["code"] == "missing_permission"

        # check user not in project
        url = f"{self.endpoint}?project_id={project.pk}"
        user = user_factory.create()
        client.force_authenticate(user)
        response: Response = client.get(url)
        content_dict: dict[str, Any] = json.loads(response.content)

        assert response.status_code == 403
        assert content_dict["code"] == "missing_permission"
