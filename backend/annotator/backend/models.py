import os.path
from typing import Protocol

from django.db import models
from django.contrib.auth.models import User

from . import constants


class Project(models.Model):
    name = models.CharField(max_length=constants.PROJECT_NAME_MAX_LENGTH)
    description = models.TextField(max_length=constants.PROJECT_DESCRIPTION_MAX_LENGTH)
    created = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(
        User,
        blank=False,
        # project is deleted when owner is deleted,
        # should probably change with ownership transfer implementation
        on_delete=models.CASCADE,
        related_name="ownedProjects",
    )
    users = models.ManyToManyField(User, blank=True, related_name="projects")

    class Meta:
        ordering = ["created"]

    def __str__(self) -> str:  # pragma: no cover
        return self.name


class FilePathObject(Protocol):
    filePath: str


def get_file_path(instance: FilePathObject, filename: str) -> str:
    return os.path.join(instance.filePath, filename)


class File(models.Model):
    # should be set on creation by 'file holder'
    filePath = models.CharField(max_length=constants.FILE_FILEPATH_MAX_LENGTH)
    uploadDate = models.DateTimeField(auto_now=True)
    uploaded_by = models.ForeignKey(
        User,
        blank=False,
        null=True,
        default=None,
        on_delete=models.SET_NULL,
        related_name="updated_files",
    )
    fileFormat = models.CharField(max_length=constants.FILE_FILEFORMAT_MAX_LENGTH)
    file = models.FileField(upload_to=get_file_path)

    def get_fileSize(self) -> int:
        return self.file.size


def get_adopter_user() -> User:
    return User.objects.get_or_create(username="ModelDataAdopter")[0]


class ModelData(models.Model):
    name = models.CharField(max_length=constants.MODELDATA_NAME_MAX_LENGTH)
    modelType = models.CharField(max_length=constants.MODELDATA_MODELTYPE_MAX_LENGTH)
    annotationType = models.CharField(
        max_length=constants.MODELDATA_ANNOTATIONTYPE_MAX_LENGTH
    )
    project = models.ForeignKey(
        Project,
        blank=False,
        related_name="modelData",
        # ModelData gets deleted with the Project
        on_delete=models.CASCADE,
    )
    owner = models.ForeignKey(
        User,
        blank=False,
        related_name="modelData",
        # for now the user ModelDataAdopter adopts them on deletion
        on_delete=models.SET(get_adopter_user),
    )
    locked = models.ForeignKey(
        User,
        blank=True,
        null=True,
        related_name="lockedModels",
        on_delete=models.SET_NULL,
    )
    annotationFile = models.OneToOneField(
        File,
        blank=True,
        null=True,
        # files do not have a backwards relation to ModelData
        related_name="+",
        on_delete=models.SET_NULL,
    )
    baseFile = models.OneToOneField(
        File,
        blank=True,
        null=True,
        # files do not have a backwards relation to ModelData
        related_name="+",
        on_delete=models.SET_NULL,
    )


class Label(models.Model):
    name = models.CharField(max_length=constants.LABEL_NAME_MAX_LENGTH)
    annotationClass = models.IntegerField()
    color = models.IntegerField()
    project = models.ForeignKey(
        Project, blank=False, related_name="labels", on_delete=models.CASCADE
    )
