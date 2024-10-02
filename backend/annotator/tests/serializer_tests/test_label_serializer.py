import pytest
from rest_framework.exceptions import ValidationError

from annotator.backend.models import Project, Label
from annotator.backend.serializers import LabelSerializer

from django.contrib.auth.models import User

from annotator.tests.factories import LabelFactory


class TestLabelSerializer:
    @pytest.mark.django_db
    def test_serialize_model(
        self, user: User, label_factory: LabelFactory, project: Project
    ):
        label: Label = label_factory.build()
        label.project = project
        label.pk = 1
        expected_serialized_data = {
            "name": label.name,
            "color": label.color,
            "annotationClass": label.annotationClass,
            "label_id": label.id,
        }
        serializer = LabelSerializer(label)

        assert serializer.data == expected_serialized_data

    @pytest.mark.django_db
    def test_serialized_data(self, label_factory: LabelFactory, project: Project):
        label: Label = label_factory.build()
        valid_serialized_data = {
            "project_id": project.id,
            "name": label.name,
            "color": label.color,
            "annotationClass": label.annotationClass,
        }

        serializer = LabelSerializer(data=valid_serialized_data)

        assert serializer.is_valid(raise_exception=True)
        assert serializer.errors == {}

    @pytest.mark.django_db
    def test_label_update_with_queryset(
        self, label_factory: LabelFactory, project: Project
    ):
        label: Label = label_factory.build_batch(2)
        valid_serialized_data = {
            "project_id": project.id,
            "name": label[0].name,
            "color": label[0].color,
            "annotationClass": label[0].annotationClass,
        }

        serializer = LabelSerializer(label, data=valid_serialized_data)
        with pytest.raises(Exception, match="Cannot use update with a queryset!"):
            serializer.is_valid()
            serializer.save()

    @pytest.mark.django_db
    def test_invalid_annotation_class(
        self, label_factory: LabelFactory, project: Project
    ):
        old_label: Label = label_factory.build()
        new_label: Label = label_factory.build()
        valid_serialized_data = {
            "project_id": project.id,
            "name": old_label.name,
            "color": old_label.color,
            "annotationClass": old_label.annotationClass,
        }

        serializer = LabelSerializer(data=valid_serialized_data)
        serializer.is_valid()
        serializer.save()

        valid_serialized_data = {
            "project_id": project.id,
            "name": new_label.name,
            "color": new_label.color,
            "annotationClass": old_label.annotationClass,
        }
        serializer = LabelSerializer(data=valid_serialized_data)

        with pytest.raises(
            ValidationError,
            match="Annotation class has to be unique within the project.",
        ):
            serializer.validate_annotationClass(
                valid_serialized_data["annotationClass"]
            )
