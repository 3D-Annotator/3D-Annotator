from typing import Any

from rest_framework.views import exception_handler
from rest_framework import exceptions
from rest_framework.response import Response
from rest_framework.exceptions import APIException

from django.http import Http404
from django.core.exceptions import PermissionDenied


def code_exception_handler(
    exc: Exception | APIException, context: dict[str, Any]
) -> Response | None:
    print(f"exception: {exc}")
    response = exception_handler(exc, context)

    if response is None:
        return None

    print(f"response: {response.data}")

    # convert django exceptions to rest framework exceptions
    if isinstance(exc, Http404):
        exc = exceptions.NotFound(detail=str(exc))
    elif isinstance(exc, PermissionDenied):
        exc = exceptions.PermissionDenied(detail=str(exc))

    if not isinstance(exc, APIException):
        return response

    new_data: dict[str, str | bool | list[dict[str, str]]] = {}
    if isinstance(exc.detail, (list, dict)):
        new_data["containsErrorList"] = True
        new_data["errors"] = exc.get_full_details()

        if isinstance(exc, exceptions.ValidationError):
            new_data[
                "message"
            ] = "Some fields contain invalid values. See 'errors' for more info."
            new_data["code"] = "validation_errors"
        else:
            new_data["message"] = "This exception contains a list of errors."
            new_data["code"] = "error_list"

    else:
        new_data = exc.get_full_details()
        new_data["containsErrorList"] = False

    response.data = new_data

    return response
