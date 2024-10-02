from typing import Optional

import factory
from faker import Faker
from django.contrib.auth.models import User

from annotator.backend import models, constants

Faker("de_DE")


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.faker.Faker(
        "user_name",
    )
    email = factory.faker.Faker(
        "email",
    )
    password = factory.faker.Faker("password", length=8)

    @factory.post_generation
    def set_password_on_user(
        self, create: bool, results: Optional[dict] = None
    ) -> None:
        self.raw_password = self.password
        self.set_password(self.password)


class ProjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.Project

    name = factory.faker.Faker("text", max_nb_chars=constants.PROJECT_NAME_MAX_LENGTH)
    description = factory.faker.Faker(
        "text", max_nb_chars=constants.PROJECT_DESCRIPTION_MAX_LENGTH
    )
    owner = factory.SubFactory(UserFactory)


class LabelFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.Label

    name = factory.faker.Faker("color_name", max_length=constants.LABEL_NAME_MAX_LENGTH)
    color = factory.faker.Faker(
        "random_int", min=constants.INTEGER_MIN, max=constants.INTEGER_MAX
    )
    annotationClass = factory.faker.Faker(
        "random_int", min=constants.INTEGER_MIN, max=constants.INTEGER_MAX
    )
    project = factory.SubFactory(ProjectFactory)


class ModelDataFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.ModelData

    name = factory.faker.Faker("text", max_nb_chars=constants.MODELDATA_NAME_MAX_LENGTH)
    owner = factory.SubFactory(UserFactory)
    project = factory.SubFactory(ProjectFactory)
    modelType = factory.faker.Faker("random_element", elements=("mesh", "pointcloud"))
    annotationType = factory.faker.Faker("random_element", elements=("index"))


class FileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = models.File

    filePath = factory.faker.Faker("numerify", text="projects/@#/@#/")
    fileFormat = factory.faker.Faker("random_element", elements=("ply", "obj"))
    file = factory.django.FileField(
        data=factory.faker.Faker("zip"),
        filename=factory.faker.Faker(
            "random_element", elements=("baseFile.zip", "annotationFile.zip")
        ),
    )
    uploaded_by = factory.SubFactory(UserFactory)
