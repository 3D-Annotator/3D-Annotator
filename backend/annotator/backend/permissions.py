from typing import Union

from django.contrib.auth.models import User, AnonymousUser
from django.db.models import Model

from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView

from . import models


class IsPartOfProject(BasePermission):
    message = "You need to be a part of the project/s to use this."
    code = "missing_permission"

    def has_object_permission(
        self, request: Request, view: APIView, obj: Model
    ) -> bool:
        temp_obj = obj
        if isinstance(temp_obj, models.ModelData):
            temp_obj = temp_obj.project
        elif isinstance(temp_obj, models.Label):
            temp_obj = temp_obj.project
        if isinstance(temp_obj, models.Project):
            return (
                request.user in temp_obj.users.all() or request.user == temp_obj.owner
            )
        raise Exception("Cannot use permission IsPartOfProject on the object!")


class IsProjectOwner(BasePermission):
    message = "You need to be the project owner to use this."
    code = "missing_permission"

    def has_object_permission(
        self, request: Request, view: APIView, obj: Model
    ) -> bool:
        temp_obj = obj
        if isinstance(temp_obj, models.ModelData):
            temp_obj = temp_obj.project
        elif isinstance(temp_obj, models.Label):
            temp_obj = temp_obj.project
        if isinstance(temp_obj, models.Project):
            return request.user == temp_obj.owner
        raise Exception("Cannot use permission IsProjectOwner on the object!")


class DetailedUserPermission(BasePermission):
    message = "Only the user himself can use this."
    code = "missing_permission"

    def has_object_permission(
        self, request: Request, view: APIView, obj: Union[User, AnonymousUser]
    ) -> bool:
        return request.user == obj
