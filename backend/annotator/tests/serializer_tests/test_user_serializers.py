import pytest

from annotator.backend import constants
from annotator.backend.serializers import UserSerializer, ReducedUserSerializer

from django.contrib.auth.models import User

from annotator.tests.conftest import fake

from annotator.tests.factories import UserFactory


class TestUserSerializer:
    @pytest.mark.unit
    def test_serialize_model(self, user_factory: UserFactory):
        user: User = user_factory.build()
        user.pk = 1
        expected_serialized_data = {
            "user_id": user.pk,
            "username": user.username,
            "email": user.email,
        }
        serializer = UserSerializer(user)

        assert serializer.data == expected_serialized_data

    @pytest.mark.django_db
    def test_serialized_data(self, user_factory: UserFactory):
        user: User = user_factory.build()
        valid_serialized_data = {
            "username": user.username,
            "email": user.email,
            "password": user.password,
        }

        serializer = UserSerializer(data=valid_serialized_data)

        assert serializer.is_valid(raise_exception=True)
        assert serializer.errors == {}

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "username",
        [
            "",
            fake.password(
                length=constants.USER_USERNAME_MAX_LENGTH + 1, special_chars=False
            ),
        ],
    )
    def test_invalid_username_serialized(self, username, user_factory: UserFactory):
        user: User = user_factory.build()
        valid_serialized_data = {
            "username": username,
            "email": user.email,
            "password": user.password,
        }

        serializer = UserSerializer(data=valid_serialized_data)
        assert not serializer.is_valid()
        assert len(serializer.errors) > 0

    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "email",
        [
            "",
            "testtest.com",
            "test@test",
            fake.password(
                length=constants.USER_EMAIL_MAX_LENGTH + 1, special_chars=False
            ),
        ],
    )
    def test_invalid_email_serialized(self, user_factory: UserFactory, email):
        user = user_factory.build()
        valid_serialized_data = {
            "username": user.username,
            "email": email,
            "password": user.password,
        }

        serializer = UserSerializer(data=valid_serialized_data)
        assert not serializer.is_valid()
        assert len(serializer.errors) > 0

    @pytest.mark.django_db
    @pytest.mark.parametrize("password", ["", "12345678"])
    def test_invalid_password_serialized(self, user_factory: UserFactory, password):
        user: User = user_factory.build()
        valid_serialized_data = {
            "username": user.username,
            "email": user.email,
            "password": password,
        }

        serializer = UserSerializer(data=valid_serialized_data)
        assert not serializer.is_valid()
        assert len(serializer.errors) > 0


class TestReducedUserSerializer:
    @pytest.mark.django_db
    def test_serialized_data(self, user_factory: UserFactory):
        user: User = user_factory.build()
        valid_serialized_data = {
            "user_id": user.pk,
            "username": user.username,
        }

        serializer = ReducedUserSerializer(data=valid_serialized_data)

        assert serializer.is_valid(raise_exception=True)
        assert serializer.errors == {}
