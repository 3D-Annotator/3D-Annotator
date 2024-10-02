import pytest

from annotator.backend.serializers import LockSerializer

from django.contrib.auth.models import User


class TestLockSerializer:
    @pytest.mark.django_db
    @pytest.mark.parametrize("lock", [True, False])
    def test_serialized_data(self, user: User, lock: bool):
        valid_serialized_data = {"lock": lock, "user_id": user.id}

        serializer = LockSerializer(data=valid_serialized_data)

        assert serializer.is_valid(raise_exception=True)
        assert serializer.errors == {}
