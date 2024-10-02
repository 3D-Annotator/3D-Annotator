import pytest

from annotator.backend.serializers import (
    ProjectUserSerializer,
)

from django.contrib.auth.models import User

from annotator.tests.factories import UserFactory


class TestProjectUserSerializer:
    @pytest.mark.django_db
    def test_serialize_model(self, user_factory: UserFactory):
        user: User = user_factory.build()
        user.pk = 1
        expected_serialized_data = {
            "user_id": user.pk,
            "username": user.username,
        }
        serializer = ProjectUserSerializer(user)

        assert serializer.data == expected_serialized_data

    @pytest.mark.django_db
    def test_serialized_data(self, user: User):
        valid_serialized_data = {
            "user_id": user.pk,
        }

        serializer = ProjectUserSerializer(data=valid_serialized_data)

        assert serializer.is_valid(raise_exception=True)
        assert serializer.errors == {}

    @pytest.mark.django_db
    def test_invalid_userid(self, user: User):
        valid_serialized_data = {
            "user_id": user.pk + 1,
        }

        serializer = ProjectUserSerializer(data=valid_serialized_data)

        assert not serializer.is_valid()
        assert len(serializer.errors) > 0
