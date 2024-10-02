import pytest

from annotator.backend import models
from annotator.backend.models import Project, ModelData
from annotator.backend.serializers import ModelDataSerializer

from django.contrib.auth.models import User

from annotator.tests.factories import ModelDataFactory


class TestModelDataSerializer:
    @pytest.mark.django_db
    def test_serialize_model(
        self, user: User, model_data_factory: ModelDataFactory, project: Project
    ):
        modelData: ModelData = model_data_factory.build()
        modelData.project = project
        modelData.pk = 42
        modelData.owner = user
        expected_serialized_data = {
            "name": modelData.name,
            "annotationType": modelData.annotationType,
            "modelData_id": modelData.id,
            "modelType": modelData.modelType,
            "annotationFile": None,
            "baseFile": None,
            "locked": None,
            "project_id": project.id,
        }

        serializer = ModelDataSerializer(modelData)
        result = serializer.data
        result.pop("owner")

        assert result == expected_serialized_data

    @pytest.mark.django_db
    def test_serialized_data(
        self, user: User, model_data_factory: ModelDataFactory, project: Project
    ):
        modelData: ModelData = model_data_factory.build()
        valid_serialized_data = {
            "project_id": project.id,
            "name": modelData.name,
            "modelType": modelData.modelType,
            "annotationType": modelData.annotationType,
        }

        serializer = ModelDataSerializer(data=valid_serialized_data)

        assert serializer.is_valid(raise_exception=True)
        assert serializer.errors == {}

    @pytest.mark.django_db
    def test_model_data_update_with_queryset(
        self, model_data_factory: ModelDataFactory, project: Project
    ):
        model_data: ModelData = model_data_factory.build_batch(2)
        valid_serialized_data = {
            "project_id": project.id,
            "name": model_data[0].name,
            "modelType": model_data[0].modelType,
            "annotationType": model_data[0].annotationType,
        }

        serializer = ModelDataSerializer(model_data, data=valid_serialized_data)

        with pytest.raises(Exception, match="Cannot use update with a queryset!"):
            serializer.is_valid()
            serializer.save()

    @pytest.mark.django_db
    def test_model_data_adopt_user(
        self, model_data_factory: ModelDataFactory, project: Project
    ):
        model_data: ModelData = model_data_factory.create(project=project)
        User.objects.filter(pk=model_data.owner.pk).delete()
        model_data.refresh_from_db()

        assert model_data.owner.pk == models.get_adopter_user().pk

        valid_serialized_data = {
            "project_id": project.id,
            "name": model_data.name,
            "modelType": model_data.modelType,
            "annotationType": model_data.annotationType,
        }

        serializer = ModelDataSerializer(model_data, data=valid_serialized_data)

        assert serializer.is_valid(raise_exception=True)
        assert serializer.errors == {}
