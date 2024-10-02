import pytest
from django.contrib.auth import user_logged_out
from django.contrib.auth.models import User
from django.db.models.signals import post_delete
from pytest_mock import MockerFixture

from annotator.backend.models import ModelData
from annotator.tests.factories import ModelDataFactory, UserFactory


class TestModelDataSignals:
    @pytest.mark.skip
    @pytest.mark.unit
    def test_post_delete(
        self, mocker: MockerFixture, model_data_factory: ModelDataFactory
    ):
        instance: ModelData = model_data_factory.build()
        instance.pk = 1
        mock = mocker.patch("annotator.backend.signals.post_delete_modeldata_handler")
        post_delete.send(ModelData, instance=instance, using="sqlite3")

        mock.assert_called_once()

    @pytest.mark.unit
    def test_user_logged_out(self, mocker: MockerFixture, user_factory: UserFactory):
        instance: User = user_factory.build()

        mock = mocker.patch("annotator.backend.signals.unlock_modeldata_from_user")
        user_logged_out.send(User, user=instance, request=None)

        mock.assert_called_once_with(instance)
