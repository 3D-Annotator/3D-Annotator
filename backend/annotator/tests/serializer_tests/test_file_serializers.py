import datetime

import pytest
from _pytest.monkeypatch import MonkeyPatch
from rest_framework.exceptions import ValidationError
from rest_framework.fields import DateTimeField

from annotator.backend.models import File
from annotator.backend.serializers import (
    FileSerializer,
    FileUploadSerializer,
    BaseFileUploadSerializer,
    AnnotationFileUploadSerializer,
)

from annotator.tests import factories
from annotator.tests.conftest import test_dir_path


class TestFileSerializer:
    @pytest.mark.unit
    @pytest.mark.parametrize(
        "filename",
        [
            "annotationFile",
            "baseFile",
        ],
    )
    def test_serialize_model(
        self,
        user_factory: factories.UserFactory,
        filename: str,
        file_factory: factories.FileFactory,
    ):
        user = user_factory.build()
        user.pk = 1
        file_path = test_dir_path + "test_files/"
        filename_with_ending = filename + ".zip"
        file: File = file_factory.build(filePath=file_path, uploaded_by=user)
        file.file.name = filename_with_ending
        file.uploadDate = datetime.datetime.now()

        expected_serialized_data = {
            "fileFormat": file.fileFormat,
            "fileSize": file.file.size,
            "uploadDate": DateTimeField().to_representation(file.uploadDate),
        }
        serializer = FileSerializer(file)
        data = serializer.data
        user_json = data.pop("uploaded_by")

        assert data == expected_serialized_data
        assert file.file.size is not None
        assert user_json is not None


class TestUploadFileSerializer:
    @pytest.mark.unit
    @pytest.mark.parametrize(
        "filename",
        [
            "annotationFile",
            "baseFile",
        ],
    )
    def test_serialized_data(self, file_factory: factories.FileFactory, filename: str):
        file_path = test_dir_path + "test_files/"
        filename_with_ending = filename + ".zip"
        file: File = file_factory.build(filePath=file_path)
        file.file.name = filename_with_ending

        valid_serialized_data = {
            "fileFormat": file.fileFormat,
            "file": file.file,
        }

        serializer = FileUploadSerializer(data=valid_serialized_data)

        assert serializer.is_valid(raise_exception=True)
        assert serializer.errors == {}


class TestBaseFileUploadSerializer:
    @pytest.mark.unit
    @pytest.mark.parametrize(
        "filename,assert_value", [("annotationFile", False), ("baseFile", True)]
    )
    def test_serialized_data(
        self, file_factory: factories.FileFactory, filename: str, assert_value: bool
    ):
        file_path = test_dir_path + "test_files/"
        filename_with_ending = filename + ".zip"
        file: File = file_factory.build(filePath=file_path)
        file.file.name = filename_with_ending

        valid_serialized_data = {
            "fileFormat": file.fileFormat,
            "file": file.file,
        }

        serializer = BaseFileUploadSerializer(data=valid_serialized_data)

        assert serializer.is_valid() == assert_value
        assert serializer.errors == {} or not assert_value

    @pytest.mark.unit
    def test_update(self, file_factory: factories.FileFactory):
        file_path = test_dir_path + "test_files/"
        filename_with_ending = "baseFile.zip"
        file: File = file_factory.build(filePath=file_path)
        file.file.name = filename_with_ending

        valid_serialized_data = {
            "fileFormat": file.fileFormat,
            "file": file.file,
        }

        serializer = BaseFileUploadSerializer(file, data=valid_serialized_data)
        with pytest.raises(ValidationError):
            serializer.is_valid()
            serializer.save()


class TestAnnotationFileUploadSerializer:
    @pytest.mark.unit
    @pytest.mark.parametrize(
        "filename,assert_value", [("annotationFile", True), ("baseFile", False)]
    )
    def test_serialized_data(
        self, file_factory: factories.FileFactory, filename: str, assert_value: bool
    ):
        file_path = test_dir_path + "test_files/"
        filename_with_ending = filename + ".zip"
        file: File = file_factory.build(filePath=file_path)
        file.file.name = filename_with_ending

        valid_serialized_data = {
            "fileFormat": file.fileFormat,
            "file": file.file,
        }

        serializer = AnnotationFileUploadSerializer(data=valid_serialized_data)

        assert serializer.is_valid() == assert_value
        assert serializer.errors == {} or not assert_value

    @pytest.mark.skip
    @pytest.mark.unit
    @pytest.mark.parametrize(
        "filename,assert_value", [("annotationFile", True), ("baseFile", False)]
    )
    def test_invalid_size(
        self,
        file_factory: factories.FileFactory,
        filename: str,
        assert_value: bool,
        monkeypatch: MonkeyPatch,
    ):
        file_path = test_dir_path + "test_files/"
        filename_with_ending = filename + ".zip"
        file: File = file_factory.build(filePath=file_path)
        file.file.name = filename_with_ending
        monkeypatch.setattr(file.file, "size", None)

        valid_serialized_data = {
            "fileFormat": file.fileFormat,
            "file": file.file,
        }
        serializer = AnnotationFileUploadSerializer(data=valid_serialized_data)

        with pytest.raises(
            Exception, match="File error. File size should not be none!"
        ):
            serializer.is_valid()
