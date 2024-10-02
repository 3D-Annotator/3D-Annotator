import json
from typing import Any

from django.core.files.uploadedfile import SimpleUploadedFile
from django.http import FileResponse

from rest_framework.request import Request

from annotator.backend import utils
from annotator.backend.models import ModelData, File
from annotator.backend.views import FileViewSet

import pytest

from django.urls import reverse
from requests import Response

from rest_framework.test import force_authenticate

from annotator.tests.conftest import (
    api_client as api_client_function,
    test_dir_path,
    fake,
    api_factory as api_factory_function,
)
from annotator.tests import factories

pytestmark = pytest.mark.django_db


class TestFileEndpoints:
    @pytest.mark.parametrize(
        "filename",
        [
            "annotationFile",
            "baseFile",
        ],
    )
    def test_download(
        self,
        filename,
        model_data: ModelData,
        file_factory: factories.FileFactory,
        api_client: api_client_function,
    ):
        endpoint = reverse(filename.lower(), kwargs={"pk": model_data.id})
        user = model_data.owner

        file_path = test_dir_path + utils.get_modeldata_file_path(
            model_data, model_data.project
        )
        filename_with_ending = filename + ".zip"
        file: File = file_factory.build(filePath=file_path, uploaded_by=user)
        file.file.name = filename_with_ending
        file.save()
        model_data.__setattr__(filename, file)
        model_data.save()

        client = api_client()
        client.force_authenticate(user)
        response: FileResponse = client.get(endpoint)
        assert response.status_code == 200
        assert response.filename == filename_with_ending
        assert int(response.headers["content-length"]) == file.file.size

    def test_upload_basefile(
        self,
        model_data: ModelData,
        api_factory: api_factory_function,
    ):
        endpoint = reverse("basefile", kwargs={"pk": model_data.id})
        file_data = fake.zip()
        upload_file = SimpleUploadedFile(
            "baseFile.zip", file_data, content_type="multipart/form-data"
        )
        data = {"file": upload_file, "fileFormat": "obj"}
        user = model_data.owner

        fac = api_factory()
        request: Request = fac.put(
            endpoint,
            data,
        )
        force_authenticate(request, user=user)
        response: Response = FileViewSet.as_view({"put": "upload_basefile"})(
            request, pk=model_data.id
        )
        model_data.refresh_from_db()

        assert model_data.baseFile.file.size == data["file"].size
        assert model_data.baseFile.fileFormat == data["fileFormat"]

        response: Response = FileViewSet.as_view({"put": "upload_basefile"})(
            request, pk=model_data.id
        )

        assert response.status_code == 403
        assert model_data.baseFile.file.size == data["file"].size
        assert model_data.baseFile.fileFormat == data["fileFormat"]

    def test_upload_annotationfile(
        self,
        model_data: ModelData,
        file_factory: factories.FileFactory,
        api_factory: api_factory_function,
    ):
        endpoint = reverse("annotationfile", kwargs={"pk": model_data.id})
        file_data = fake.zip()
        upload_file = SimpleUploadedFile(
            "annotationFile.zip", file_data, content_type="multipart/form-data"
        )
        data = {"file": upload_file, "fileFormat": "obj"}
        user = model_data.owner

        fac = api_factory()
        request: Request = fac.put(
            endpoint,
            data,
        )
        force_authenticate(request, user=user)
        response: Response = FileViewSet.as_view({"put": "upload_annotationfile"})(
            request, pk=model_data.id
        )
        model_data.refresh_from_db()

        assert response.status_code == 201
        assert model_data.annotationFile.file.size == data["file"].size
        assert model_data.annotationFile.fileFormat == data["fileFormat"]

        response: Response = FileViewSet.as_view({"put": "upload_annotationfile"})(
            request, pk=model_data.id
        )
        model_data.refresh_from_db()

        assert response.status_code == 201
        assert model_data.annotationFile.file.size == data["file"].size
        assert model_data.annotationFile.fileFormat == data["fileFormat"]

    @pytest.mark.parametrize(
        "filename",
        [
            "annotationFile",
            "baseFile",
        ],
    )
    def test_invalid_download(
        self,
        filename,
        model_data: ModelData,
        api_client: api_client_function,
    ):
        endpoint = reverse(filename.lower(), kwargs={"pk": model_data.id})

        user = model_data.owner

        client = api_client()
        client.force_authenticate(user)
        response: Response = client.get(endpoint)
        content_dict: dict[str, Any] = json.loads(response.content)

        assert response.status_code == 404
        assert content_dict["code"] == "not_found"
