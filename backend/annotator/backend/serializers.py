from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.files.uploadedfile import UploadedFile

from typing import Any, Union

from django.db.models import QuerySet
from rest_framework import serializers, validators

from . import models
from . import constants


# Readonly serializer for the User model. It only returns a reduced representation.
class ReducedUserSerializer(serializers.Serializer[Union[User, QuerySet[User]]]):
    user_id = serializers.IntegerField(read_only=True, source="pk")
    username = serializers.CharField(read_only=True)


# Serializer for creating relations between Project and User, as well as serializing
# ProjectUsers. For creation, the project argument has to be included when calling
# .save().
class ProjectUserSerializer(ReducedUserSerializer):
    user_id = serializers.IntegerField(read_only=False, source="pk")
    userObject: User

    def create(self, validated_data: dict[str, Any]) -> User:
        project: models.Project = validated_data["project"]
        user: User = self.userObject
        project.users.add(user)
        project.save()
        return user

    def validate_user_id(self, value: str) -> str:
        query = User.objects.filter(pk=value)
        if not query:
            raise serializers.ValidationError(
                "User with given ID does not exist and cant be added to the project.",
                code="does_not_exist",
            )
        self.userObject = query[0]
        return value


# Serializer for the User model. Can create/register users and returns more information
# than its parent. Updates are not possible.
class UserSerializer(ReducedUserSerializer):
    username = serializers.CharField(
        read_only=False,
        max_length=constants.USER_USERNAME_MAX_LENGTH,
        validators=[
            validators.UniqueValidator(
                queryset=User.objects.all(), message="The username is already used."
            )
        ],
    )
    email = serializers.EmailField(max_length=constants.USER_EMAIL_MAX_LENGTH)
    password = serializers.CharField(write_only=True, validators=[validate_password])

    def create(self, validated_data: dict[str, Any]) -> User:
        user = User(email=validated_data["email"], username=validated_data["username"])
        user.set_password(validated_data["password"])
        user.save()
        return user


# Readonly serializer for the File model.
class FileSerializer(serializers.Serializer[models.File]):
    fileFormat = serializers.CharField(read_only=True)
    uploadDate = serializers.DateTimeField(read_only=True)
    fileSize = serializers.IntegerField(read_only=True, source="get_fileSize")
    uploaded_by = ReducedUserSerializer(read_only=True)


# File serializer for uploading files. Can create and update File objects with uploaded
# files. A filePath argument has to be included when calling save().
class FileUploadSerializer(FileSerializer):
    file = serializers.FileField(write_only=True)
    fileFormat = serializers.CharField(max_length=constants.FILE_FILEFORMAT_MAX_LENGTH)

    def create(self, validated_data: dict[str, Any]) -> models.File:
        fileObj = models.File(**validated_data)
        fileObj.save()
        return fileObj

    # annotationFile can be lost when interrupting between deletion of old file and
    # saving of new file
    def update(
        self, instance: models.File, validated_data: dict[str, Any]
    ) -> models.File:
        instance.uploaded_by = validated_data["uploaded_by"]
        oldFile = instance.file
        oldFile.delete()
        instance.file = validated_data["file"]
        instance.save()
        return instance


# A more specific FileUploadSerializer for BaseFiles. Checks for a maximum filesize
# and the filename. Does not support updates.
class BaseFileUploadSerializer(FileUploadSerializer):
    def update(
        self, instance: models.File, validated_data: dict[str, Any]
    ) -> models.File:
        raise serializers.ValidationError("BaseFiles cannot be updated.")

    def validate_file(self, value: UploadedFile) -> UploadedFile:
        if value.size is None:
            raise Exception("File error. File size should not be none!")
        if value.size >= constants.FILE_MAX_FILESIZE:
            raise serializers.ValidationError(
                "BaseFile is too large.", code="too_large"
            )
        if value.name != "baseFile.zip":
            raise serializers.ValidationError(
                "BaseFile has to be named 'baseFile.zip'.", code="wrong_name"
            )
        return value


# A more specific FileUploadSerializer for AnnotationFiles. Checks for a maximum
# filesize and the filename.
class AnnotationFileUploadSerializer(FileUploadSerializer):
    def validate_file(self, value: UploadedFile) -> UploadedFile:
        if value.size is None:
            raise Exception("File error. File size should not be none!")
        if value.size >= constants.FILE_MAX_FILESIZE:
            raise serializers.ValidationError(
                "AnnotationFile is too large.", code="too_large"
            )
        if value.name != "annotationFile.zip":
            raise serializers.ValidationError(
                "AnnotationFile has to be named 'annotationFile.zip'.",
                code="wrong_name",
            )
        return value


# Serializer for the Label model. Can create, update and return a representation.
# Updates are only supported with partial=True argument and only for the name and color.
class LabelSerializer(
    serializers.Serializer[Union[models.Label, QuerySet[models.Label]]]
):
    label_id = serializers.IntegerField(read_only=True, source="pk")
    annotationClass = serializers.IntegerField(
        max_value=constants.INTEGER_MAX, min_value=constants.INTEGER_MIN
    )
    name = serializers.CharField(max_length=constants.LABEL_NAME_MAX_LENGTH)
    color = serializers.IntegerField(
        max_value=constants.INTEGER_MAX, min_value=constants.INTEGER_MIN
    )
    project_id = serializers.PrimaryKeyRelatedField(
        queryset=models.Project.objects.all(), write_only=True, source="project"
    )

    def create(self, validated_data: dict[str, Any]) -> models.Label:
        label = models.Label(**validated_data)
        label.save()
        return label

    def update(
        self,
        instance: Union[models.Label, QuerySet[models.Label]],
        validated_data: dict[str, Any],
    ) -> models.Label:
        if not isinstance(instance, models.Label):
            raise Exception("Cannot use update with a queryset!")
        instance.name = validated_data["name"]
        instance.color = validated_data["color"]
        instance.save()
        return instance

    def validate_annotationClass(self, value: int) -> int:
        project_id = self.initial_data.get("project_id")
        if not project_id:
            return value
        if (
            models.Label.objects.all()
            .filter(project_id=project_id, annotationClass=value)
            .exists()
        ):
            raise serializers.ValidationError(
                "Annotation class has to be unique within the project.",
                code="annotationclass_not_unique",
            )
        return value


# Serializer for the ModelData model. Can create, update and return a representation.
# For creation, the owner argument has to be included when calling .save().
# Updates are only supported with partial=True argument and only for the name.
class ModelDataSerializer(
    serializers.Serializer[Union[models.ModelData, QuerySet[models.ModelData]]]
):
    modelData_id = serializers.IntegerField(read_only=True, source="pk")
    owner = ReducedUserSerializer(read_only=True)
    name = serializers.CharField(max_length=constants.MODELDATA_NAME_MAX_LENGTH)
    modelType = serializers.CharField(
        max_length=constants.MODELDATA_MODELTYPE_MAX_LENGTH
    )
    annotationType = serializers.CharField(
        max_length=constants.MODELDATA_ANNOTATIONTYPE_MAX_LENGTH
    )
    baseFile = FileSerializer(read_only=True)
    annotationFile = FileSerializer(read_only=True)
    locked = ReducedUserSerializer(read_only=True)
    project_id = serializers.PrimaryKeyRelatedField(
        queryset=models.Project.objects.all(), write_only=False, source="project"
    )

    def create(self, validated_data: dict[str, Any]) -> models.ModelData:
        modelData = models.ModelData(**validated_data)
        modelData.save()
        return modelData

    def update(
        self,
        instance: Union[models.ModelData, QuerySet[models.ModelData]],
        validated_data: dict[str, Any],
    ) -> models.ModelData:
        if not isinstance(instance, models.ModelData):
            raise Exception("Cannot use update with a queryset!")
        instance.name = validated_data["name"]
        instance.save()
        return instance


# Readonly serializer for the Project model. It only returns a reduced representation.
class ReducedProjectSerializer(serializers.Serializer[models.Project]):
    project_id = serializers.IntegerField(read_only=True, source="pk")
    owner = ReducedUserSerializer(read_only=True)
    created = serializers.DateTimeField(read_only=True)
    name = serializers.CharField(
        read_only=True, max_length=constants.PROJECT_NAME_MAX_LENGTH
    )
    description = serializers.CharField(
        read_only=True, max_length=constants.PROJECT_DESCRIPTION_MAX_LENGTH
    )


# Serializer for the Project model. Can create, update and returns a more
# detailed representation than its parent. For creation, the owner argument
# has to be included when calling .save(). Updates are only for the name and
# the description.
class ProjectSerializer(ReducedProjectSerializer):
    project_id = serializers.IntegerField(read_only=True, source="pk")
    name = serializers.CharField(
        read_only=False, max_length=constants.PROJECT_NAME_MAX_LENGTH
    )
    description = serializers.CharField(
        read_only=False,
        allow_blank=True,
        max_length=constants.PROJECT_DESCRIPTION_MAX_LENGTH,
    )
    users = ReducedUserSerializer(read_only=True, many=True)
    modelData = ModelDataSerializer(read_only=True, many=True)
    labels = LabelSerializer(read_only=True, many=True)

    def create(self, validated_data: dict[str, Any]) -> models.Project:
        project = models.Project(**validated_data)
        project.save()
        return project

    def update(
        self, instance: models.Project, validated_data: dict[str, Any]
    ) -> models.Project:
        instance.name = validated_data["name"]
        instance.description = validated_data["description"]
        instance.save()
        return instance


class LockSerializer(serializers.Serializer[User]):
    lock = serializers.BooleanField(write_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        required=False, queryset=User.objects.all(), write_only=True, source="user"
    )
