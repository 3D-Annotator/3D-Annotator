from typing import Type

import factory
import faker
from pytest_factoryboy import register
from rest_framework.test import APIClient, APIRequestFactory

import pytest

from annotator.tests.factories import (
    UserFactory,
    ProjectFactory,
    LabelFactory,
    ModelDataFactory,
    FileFactory,
)


fake = faker.Faker("de_DE")
factory.faker.Faker._DEFAULT_LOCALE = "de_DE"
test_dir_path = "test/"

register(UserFactory)
register(ProjectFactory)
register(LabelFactory)
register(ModelDataFactory)
register(FileFactory)


@pytest.fixture
def api_client() -> Type[APIClient]:
    return APIClient


@pytest.fixture
def api_factory() -> Type[APIRequestFactory]:
    return APIRequestFactory
