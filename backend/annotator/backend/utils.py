from typing import Optional, Union

from django.db.models import Model

from rest_framework.views import APIView

from . import permissions
from annotator.backend.models import ModelData, Project

from django.contrib.auth.models import User, AnonymousUser


def unlock_modeldata_from_user(user: User) -> None:
    for modeldata in user.lockedModels.all():
        modeldata.locked = None
        modeldata.save()


def check_modeldata_lock(
    view: APIView,
    modeldata: ModelData,
    user: Optional[Union[User, AnonymousUser]] = None,
    allow_owner: Optional[bool] = False,
) -> None:
    if modeldata.locked is None:
        return

    if user != modeldata.locked and not (
        allow_owner
        and permissions.IsProjectOwner().has_object_permission(
            view.request, view, modeldata
        )
    ):
        view.permission_denied(
            view.request,
            message="No permission to access the lock of this ModelData.",
            code="modeldata_locked",
        )


def check_project_permission(view: APIView, project: Project) -> None:
    if not permissions.IsPartOfProject().has_object_permission(
        view.request, view, project
    ):
        view.permission_denied(
            view.request,
            message=permissions.IsPartOfProject.message,
            code=permissions.IsPartOfProject.code,
        )


def check_project_owner_or_himself(
    view: APIView, obj: Model, user: Union[User, AnonymousUser]
) -> None:
    if not (
        permissions.DetailedUserPermission().has_object_permission(
            view.request, view, user
        )
        or permissions.IsProjectOwner().has_object_permission(view.request, view, obj)
    ):
        view.permission_denied(
            view.request,
            message="For this action you need to have permission over this user"
            + " or be the project owner.",
            code="missing_permission",
        )


def get_modeldata_file_path(modeldata: ModelData, project: Project) -> str:
    return f"projects/{project.pk}/{modeldata.pk}/"
