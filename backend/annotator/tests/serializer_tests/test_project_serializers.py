import datetime

import pytest
from rest_framework.fields import DateTimeField

from annotator.backend.models import Project
from annotator.backend.serializers import ProjectSerializer, ReducedProjectSerializer

from django.contrib.auth.models import User

from annotator.tests.factories import ProjectFactory


class TestProjectSerializer:
    @pytest.mark.django_db
    def test_serialize_model(self, user: User, project_factory: ProjectFactory):
        project: Project = project_factory.build()
        project.pk = 1
        project.owner = user
        project.created = datetime.datetime.now()
        project.users.set([])
        project.modelData.set([])
        project.labels.set([])
        expected_serialized_data = {
            "project_id": project.pk,
            "name": project.name,
            "description": project.description,
            "created": DateTimeField().to_representation(project.created),
            "modelData": [],
            "labels": [],
            "users": [],
        }
        serializer = ProjectSerializer(project)
        result = serializer.data
        result.pop("owner")

        assert result == expected_serialized_data

    @pytest.mark.django_db
    def test_serialized_data(self, project_factory: ProjectFactory):
        project: Project = project_factory.build()
        valid_serialized_data = {
            "name": project.name,
            "description": project.description,
        }

        serializer = ProjectSerializer(data=valid_serialized_data)

        assert serializer.is_valid(raise_exception=True)
        assert serializer.errors == {}


class TestReducedProjectSerializer:
    @pytest.mark.django_db
    def test_serialize_model(self, user: User, project_factory: ProjectFactory):
        project: Project = project_factory.build()
        project.pk = 1
        project.created = datetime.datetime.now()
        project.owner = user
        expected_serialized_data = {
            "project_id": project.pk,
            "name": project.name,
            "description": project.description,
            "created": DateTimeField().to_representation(project.created),
        }
        serializer = ReducedProjectSerializer(project)
        result = serializer.data
        result.pop("owner")

        assert result == expected_serialized_data
