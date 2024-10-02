from typing import Any

from annotator.backend.models import Project, ModelData

import pytest

from django.urls import reverse
from requests import Response

from annotator.tests.conftest import api_client as api_client_function
from annotator.tests import factories
import json

from annotator.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


class TestModelDataEndpoint:
    endpoint = reverse("modeldata-list")

    def test_list(
        self,
        project: Project,
        api_client: api_client_function,
        model_data_factory: factories.ModelDataFactory,
        project_factory: factories.ProjectFactory,
    ):
        model_data_factory.create_batch(4, project=project)
        project2 = project_factory.create(owner=project.owner)
        model_data_factory.create_batch(2, project=project2)

        assert ModelData.objects.all().count() == 6

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
        model_data_factory: factories.ModelDataFactory,
    ):
        modelData = model_data_factory.build()
        expected_json = {
            "name": modelData.name,
            "modelType": modelData.modelType,
            "annotationType": modelData.annotationType,
            "project_id": project.pk,
        }

        client = api_client()
        client.force_authenticate(project.owner)
        response: Response = client.post(self.endpoint, data=expected_json)
        content_dict: dict[str, Any] = json.loads(response.content)

        assert response.status_code == 201
        assert content_dict["name"] == expected_json["name"]
        assert content_dict["owner"]["user_id"] == project.owner.pk
        assert content_dict["modelType"] == expected_json["modelType"]
        assert content_dict["annotationType"] == expected_json["annotationType"]

    def test_retrieve(self, model_data: ModelData, api_client: api_client_function):
        url = f"{self.endpoint}{model_data.pk}/"

        client = api_client()
        client.force_authenticate(model_data.project.owner)
        response: Response = client.get(url)
        content_dict: dict[str, Any] = json.loads(response.content)

        assert response.status_code == 200
        assert content_dict["modelData_id"] == model_data.pk
        assert content_dict["name"] == model_data.name
        assert content_dict["owner"]["user_id"] == model_data.owner.pk
        assert content_dict["modelType"] == model_data.modelType
        assert content_dict["annotationType"] == model_data.annotationType
        assert content_dict["locked"] == model_data.locked
        assert content_dict["annotationFile"] == model_data.annotationFile
        assert content_dict["baseFile"] == model_data.baseFile

    def test_update(
        self,
        project: Project,
        api_client: api_client_function,
        model_data_factory: factories.ModelDataFactory,
    ):
        old_modelData = model_data_factory.create(project=project, owner=project.owner)
        new_modelData = model_data_factory.build()
        expected_json = {
            "name": new_modelData.name,
        }

        url = f"{self.endpoint}{old_modelData.pk}/"
        client = api_client()
        client.force_authenticate(project.owner)
        response: Response = client.put(url, data=expected_json)
        content_dict: dict[str, Any] = json.loads(response.content)

        assert response.status_code == 200
        assert content_dict["name"] == expected_json["name"]
        assert content_dict["owner"]["user_id"] == project.owner.pk

    def test_delete(self, model_data: ModelData, api_client: api_client_function):
        assert ModelData.objects.all()[0] == model_data

        url = f"{self.endpoint}{model_data.pk}/"
        client = api_client()
        client.force_authenticate(model_data.project.owner)
        response: Response = client.delete(url)

        assert response.status_code == 204
        assert ModelData.objects.all().count() == 0

    def test_lock(
        self,
        model_data: ModelData,
        api_client: api_client_function,
        user_factory: factories.UserFactory,
    ):
        assert model_data.locked is None

        owner = model_data.project.owner
        user = user_factory.create()
        model_data.project.users.add(user)

        url = f"{self.endpoint}{model_data.pk}/lock/"
        data = {"lock": True}
        client = api_client()
        client.force_authenticate(user)
        response: Response = client.put(url, data=data)
        model_data.refresh_from_db()

        assert response.status_code == 204
        assert model_data.locked == user

        # check if owner can change lock on modelData
        # -> changed: owner is only allowed to always unlock
        client.force_authenticate(owner)
        response: Response = client.put(url, data=data)
        content_dict: dict[str, Any] = json.loads(response.content)
        model_data: ModelData = ModelData.objects.get(pk=model_data.pk)

        assert response.status_code == 403
        assert model_data.locked == user
        assert content_dict["code"] == "modeldata_locked"

        # check if normal user can change lock
        model_data.locked = owner
        model_data.save()
        client.force_authenticate(user)
        response: Response = client.put(url, data=data)
        content_dict: dict[str, Any] = json.loads(response.content)
        model_data.refresh_from_db()

        assert response.status_code == 403
        assert content_dict["code"] == "modeldata_locked"
        assert model_data.locked == owner

        # check if owner can unlock modelData
        data = {"lock": False}
        client.force_authenticate(owner)
        response: Response = client.put(url, data=data)
        model_data.refresh_from_db()

        assert response.status_code == 204
        assert model_data.locked is None

        # check if user can lock for owner
        data = {"lock": True, "user_id": owner.id}
        client.force_authenticate(user)
        response: Response = client.put(url, data=data)
        content_dict: dict[str, Any] = json.loads(response.content)
        model_data.refresh_from_db()

        assert response.status_code == 403
        assert content_dict["code"] == "missing_permission"
        assert model_data.locked is None

        # check if owner can lock for user
        data = {"lock": True, "user_id": user.id}
        client.force_authenticate(owner)
        response: Response = client.put(url, data=data)
        model_data.refresh_from_db()

        assert response.status_code == 204
        assert model_data.locked == user

        # check if owner can lock for user2 (is not part of Project)
        user2 = user_factory.create()
        data = {"lock": True, "user_id": user2.id}
        model_data.locked = None
        model_data.save()
        client.force_authenticate(owner)
        response: Response = client.put(url, data=data)
        content_dict: dict[str, Any] = json.loads(response.content)
        model_data.refresh_from_db()

        assert response.status_code == 403
        assert content_dict["code"] == "missing_permission"
        assert model_data.locked is None

    def test_invalid_list(
        self,
        project: Project,
        api_client: api_client_function,
        model_data_factory: factories.ModelDataFactory,
        project_factory: factories.ProjectFactory,
        user_factory: UserFactory,
    ):
        model_data_factory.create_batch(4, project=project)

        assert ModelData.objects.all().count() == 4

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
