from typing import Optional, Type, List, Any, cast, Protocol

from django.contrib.auth.models import User
from django.db.models import QuerySet
from django.http import FileResponse

from rest_framework.generics import GenericAPIView, get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from rest_framework.request import Request
from rest_framework import exceptions
from knox.models import User as KnoxUser

from knox.views import LoginView as KnoxLoginView
from knox.views import LogoutView as KnoxLogoutView

from django.utils import timezone

from . import models
from . import serializers
from . import permissions

from annotator.backend.utils import (
    check_modeldata_lock,
    check_project_permission,
    get_modeldata_file_path,
    check_project_owner_or_himself,
)

from rest_framework.permissions import IsAuthenticated, BasePermission

from annotator.backend.auth import BasicAuthentication, TokenAuthentication


# only for typing
class _SupportsHasPermission(Protocol):
    def has_permission(self, request: Request, view: APIView) -> bool:
        ...  # pragma: no cover

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        ...  # pragma: no cover


class ProjectViewSet(GenericViewSet):
    queryset = models.Project.objects.all()
    permission_classes_by_action: dict[str, List[Type[BasePermission]]] = {
        "list": [IsAuthenticated],
        "create": [IsAuthenticated],
        "retrieve": [IsAuthenticated, permissions.IsPartOfProject],
        "update": [IsAuthenticated, permissions.IsPartOfProject],
        "destroy": [IsAuthenticated, permissions.IsProjectOwner],
    }

    def list(self, request: Request) -> Response:
        self.validate_parameter()
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request: Request) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(owner=self.request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def retrieve(self, request: Request, pk: Optional[str] = None) -> Response:
        instance = self.get_object()
        # 5 tries, before server sends an error
        for i in range(5):
            try:
                serializer = self.get_serializer(instance)
                return Response(serializer.data)
            except FileNotFoundError:  # pragma: no cover
                print("file not found! retry...")
                instance.refresh_from_db()
        return Response("try again later", status=425)  # pragma: no cover

    def update(self, request: Request, pk: Optional[str] = None) -> Response:
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request: Request, pk: Optional[str] = None) -> Response:
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_serializer_class(self) -> Type[serializers.ReducedProjectSerializer]:
        if self.action == "list":
            return serializers.ReducedProjectSerializer
        return serializers.ProjectSerializer

    def get_queryset(self) -> QuerySet[models.Project]:
        user_id = self.get_parameters("user_id")
        queryset = models.Project.objects.all()
        if user_id is not None:
            queryset = queryset.filter(users=user_id) | queryset.filter(owner=user_id)
        return queryset

    def get_parameters(self, *kwargs: str) -> Optional[str]:
        return self.request.query_params.get(kwargs[0])

    def validate_parameter(self) -> None:
        user_id = self.get_parameters("user_id")
        if user_id is None:
            # send permission denied because there is no user type authorized
            # to see all, yet
            self.permission_denied(
                self.request,
                message="No permission to see all projects. Use a parameter to filter "
                + "for a specific user.",
                code="missing_permission",
            )
        if self.request.user.id != int(user_id):
            self.permission_denied(
                self.request,
                message=permissions.DetailedUserPermission.message,
                code=permissions.DetailedUserPermission.code,
            )

    def get_permissions(self) -> List[_SupportsHasPermission]:
        try:
            # return permission_classes depending on `action`
            return [
                permission()
                for permission in self.permission_classes_by_action[self.action]
            ]
        except KeyError:  # pragma: no cover
            # action is not set return default permission_classes
            return [permission() for permission in self.permission_classes]


class ModelDataViewSet(GenericViewSet):
    queryset = models.ModelData.objects.all()
    serializer_class = serializers.ModelDataSerializer
    permission_classes_by_action: dict[str, List[Type[BasePermission]]] = {
        "list": [IsAuthenticated],
        "create": [IsAuthenticated, permissions.IsPartOfProject],
        "retrieve": [IsAuthenticated, permissions.IsPartOfProject],
        "update": [IsAuthenticated, permissions.IsPartOfProject],
        "destroy": [IsAuthenticated, permissions.IsPartOfProject],
        "lock": [IsAuthenticated, permissions.IsPartOfProject],
    }

    def list(self, request: Request) -> Response:
        self.validate_parameter()
        queryset = self.get_queryset()
        # 5 tries, before server sends an error
        for i in range(5):
            try:
                serializer = self.serializer_class(queryset, many=True)
                return Response(serializer.data)
            except FileNotFoundError:  # pragma: no cover
                print("file not found! retry...")
                queryset = self.get_queryset()
        return Response("try again later", status=425)  # pragma: no cover

    def create(self, request: Request) -> Response:
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        check_project_permission(self, serializer.validated_data["project"])
        serializer.save(owner=self.request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def retrieve(self, request: Request, pk: Optional[str] = None) -> Response:
        instance = self.get_object()
        # 5 tries, before server sends an error
        for i in range(5):
            try:
                serializer = self.get_serializer(instance)
                return Response(serializer.data)
            except FileNotFoundError:  # pragma: no cover
                print("file not found! retry...")
                instance.refresh_from_db()
        return Response("try again later", status=425)  # pragma: no cover

    def update(self, request: Request, pk: Optional[str] = None) -> Response:
        instance = self.get_object()
        serializer = self.serializer_class(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request: Request, pk: Optional[str] = None) -> Response:
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["put"])
    def lock(self, request: Request, pk: Optional[str] = None) -> Response:
        modelData: models.ModelData = self.get_object()
        check_modeldata_lock(self, modelData, request.user, allow_owner=True)
        serializer = serializers.LockSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data: dict[str, Any] = serializer.validated_data
        if data["lock"]:
            user = request.user
            # check if user tries to lock, while already locked
            if modelData.locked is not None:
                self.permission_denied(
                    request,
                    message="No permission to lock a locked lock.",
                    code="modeldata_locked",
                )

            if data.get("user"):
                user = data["user"]
                if (
                    user not in modelData.project.users.all()
                    and not user == modelData.project.owner
                ):
                    self.permission_denied(
                        self.request,
                        message="The given user has to be part of the project.",
                        code=permissions.IsPartOfProject.code,
                    )
                check_project_owner_or_himself(self, modelData, user)

            # user cannot be of type AnonymousUser because of the IsAuthenticated
            # permission
            modelData.locked = cast(User, user)
        else:
            # lock gets unlocked
            modelData.locked = None

        modelData.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_queryset(self) -> QuerySet[models.ModelData]:
        user_id = self.get_parameter("user_id")
        project_id = self.get_parameter("project_id")
        projects = self.get_projects_of_user()
        queryset = models.ModelData.objects.all()

        if user_id is not None:
            queryset = queryset.filter(
                project_id__in=projects.values_list("id", flat=True)
            )
        if project_id is not None:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    def get_parameter(self, *kwargs: str) -> Optional[str]:
        return self.request.query_params.get(kwargs[0])

    def validate_parameter(self) -> None:
        user_id = self.get_parameter("user_id")
        project_id = self.get_parameter("project_id")

        if user_id is None and project_id is None:
            self.permission_denied(
                self.request,
                message="No permission to see all modelData. "
                + "Use a parameter to filter for a user or a project.",
                code="missing_permission",
            )
        if user_id is not None:
            if self.request.user.id != int(user_id):
                self.permission_denied(
                    self.request,
                    message=permissions.DetailedUserPermission.message,
                    code=permissions.DetailedUserPermission.code,
                )
        if project_id is not None:
            project = get_object_or_404(models.Project.objects, pk=int(project_id))
            if not permissions.IsPartOfProject().has_object_permission(
                self.request, self, project
            ):
                self.permission_denied(
                    self.request,
                    message=permissions.IsPartOfProject.message,
                    code=permissions.IsPartOfProject.code,
                )

    def get_projects_of_user(self) -> QuerySet[models.Project]:
        projects = models.Project.objects.all()
        return projects.filter(owner=self.request.user) | projects.filter(
            users=self.request.user
        )

    def get_permissions(self) -> List[_SupportsHasPermission]:
        try:
            # return permission_classes depending on `action`
            return [
                permission()
                for permission in self.permission_classes_by_action[self.action]
            ]
        except KeyError:  # pragma: no cover
            # action is not set return default permission_classes
            return [permission() for permission in self.permission_classes]


class LabelViewSet(GenericViewSet):
    queryset = models.Label.objects.all()
    serializer_class = serializers.LabelSerializer
    permission_classes_by_action: dict[str, List[Type[BasePermission]]] = {
        "list": [IsAuthenticated],
        "create": [IsAuthenticated],
        "retrieve": [IsAuthenticated, permissions.IsPartOfProject],
        "update": [IsAuthenticated, permissions.IsPartOfProject],
        "destroy": [IsAuthenticated, permissions.IsPartOfProject],
    }

    def list(self, request: Request) -> Response:
        self.validate_parameter()
        queryset = self.get_queryset()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)

    def create(self, request: Request) -> Response:
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        check_project_permission(self, serializer.validated_data["project"])
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def retrieve(self, request: Request, pk: Optional[str] = None) -> Response:
        instance = self.get_object()
        serializer = self.serializer_class(instance)
        return Response(serializer.data)

    def update(self, request: Request, pk: Optional[str] = None) -> Response:
        instance = self.get_object()
        serializer = self.serializer_class(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request: Request, pk: Optional[str] = None) -> Response:
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_queryset(self) -> QuerySet[models.Label]:
        user_id = self.get_parameter("user_id")
        project_id = self.get_parameter("project_id")
        projects = self.get_projects_of_user()
        queryset = models.Label.objects.all()

        if user_id is not None:
            queryset = queryset.filter(
                project_id__in=projects.values_list("id", flat=True)
            )
        if project_id is not None:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    def get_parameter(self, *kwargs: str) -> Optional[str]:
        return self.request.query_params.get(kwargs[0])

    def validate_parameter(self) -> None:
        user_id = self.get_parameter("user_id")
        project_id = self.get_parameter("project_id")

        if user_id is None and project_id is None:
            self.permission_denied(
                self.request,
                message="No permission to see all labels. Use a parameter to filter "
                + "for a user or a project.",
                code="missing_permission",
            )
        if user_id is not None:
            if self.request.user.id != int(user_id):
                self.permission_denied(
                    self.request,
                    message=permissions.DetailedUserPermission.message,
                    code=permissions.DetailedUserPermission.code,
                )
        if project_id is not None:
            project = get_object_or_404(models.Project.objects, pk=int(project_id))
            if not permissions.IsPartOfProject().has_object_permission(
                self.request, self, obj=project
            ):
                self.permission_denied(
                    self.request,
                    message=permissions.IsPartOfProject.message,
                    code=permissions.IsPartOfProject.code,
                )

    def get_projects_of_user(self) -> QuerySet[models.Project]:
        projects = models.Project.objects.all()
        return projects.filter(owner=self.request.user) | projects.filter(
            users=self.request.user
        )

    def get_permissions(self) -> List[_SupportsHasPermission]:
        try:
            # return permission_classes depending on `action`
            return [
                permission()
                for permission in self.permission_classes_by_action[self.action]
            ]
        except KeyError:  # pragma: no cover
            # action is not set return default permission_classes
            return [permission() for permission in self.permission_classes]


class ProjectUserViewSet(GenericViewSet):
    queryset = models.Project.objects.all()
    serializer_class = serializers.ProjectUserSerializer
    permission_classes_by_action: dict[str, List[Type[BasePermission]]] = {
        "list": [IsAuthenticated, permissions.IsPartOfProject],
        "create": [IsAuthenticated, permissions.IsProjectOwner],
        "destroy": [IsAuthenticated],
    }

    def list(self, request: Request, project_id: int) -> Response:
        project = self.get_project(request, project_id)
        serializer = self.serializer_class(project.users.all(), many=True)
        return Response(serializer.data)

    def create(self, request: Request, project_id: int) -> Response:
        project = self.get_project(request, project_id)
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(project=project)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(
        self, request: Request, project_id: int, pk: Optional[str] = None
    ) -> Response:
        project: models.Project = self.get_project(request, project_id)
        user = get_object_or_404(project.users, pk=pk)
        check_project_owner_or_himself(self, project, user)
        project.users.remove(user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_project(self, request: Request, project_id: int) -> models.Project:
        project = get_object_or_404(self.get_queryset(), pk=project_id)
        # manual object permission check
        self.check_object_permissions(request, project)
        return project

    def get_permissions(self) -> List[_SupportsHasPermission]:
        try:
            # return permission_classes depending on `action`
            return [
                permission()
                for permission in self.permission_classes_by_action[self.action]
            ]
        except KeyError:  # pragma: no cover
            # action is not set return default permission_classes
            return [permission() for permission in self.permission_classes]


class UserViewSet(GenericViewSet):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated, permissions.DetailedUserPermission]

    def list(self, request: Request) -> Response:
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request: Request, pk: Optional[str] = None) -> Response:
        user = self.get_object()
        serializer = self.get_serializer(user)
        return Response(serializer.data)

    def get_serializer_class(self) -> Type[serializers.ReducedUserSerializer]:
        if self.action == "list":
            return serializers.ReducedUserSerializer
        return serializers.UserSerializer


class FileViewSet(GenericViewSet):
    queryset = models.ModelData.objects.all()
    serializer_class = serializers.FileUploadSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated, permissions.IsPartOfProject]

    @action(detail=False, methods=["get"])
    def download_basefile(
        self, request: Request, pk: Optional[str] = None
    ) -> FileResponse:
        modeldata: models.ModelData = self.get_object()
        if modeldata.baseFile is None:
            raise exceptions.NotFound("BaseFile was not found.")
        try:
            file_handler = modeldata.baseFile.file.open()
            response = FileResponse(file_handler, filename="baseFile.zip")
            response.headers["Content-Length"] = file_handler.size
            return response
        except FileNotFoundError:
            raise exceptions.NotFound("BaseFile was not found.")

    @action(detail=False, methods=["get"])
    def download_annotationfile(
        self, request: Request, pk: Optional[str] = None
    ) -> FileResponse:
        modeldata: models.ModelData = self.get_object()
        if modeldata.annotationFile is None:
            raise exceptions.NotFound("AnnotationFile was not found.")

        try:
            file_handler = modeldata.annotationFile.file.open()
            response = FileResponse(file_handler, filename="annotationFile.zip")
            response.headers["Content-Length"] = file_handler.size
            return response
        except FileNotFoundError:
            raise exceptions.NotFound("AnnotationFile was not found.")

    @action(detail=False, methods=["put"])
    def upload_basefile(self, request: Request, pk: Optional[str] = None) -> Response:
        modeldata = self.get_object()

        # the baseFile is not allowed to be switched
        if modeldata.baseFile is not None:
            self.permission_denied(
                self.request,
                message="The baseFile is not allowed to be updated.",
                code="basefile_already_exists",
            )

        serializer = serializers.BaseFileUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        project = modeldata.project
        file = serializer.save(
            filePath=get_modeldata_file_path(modeldata, project),
            uploaded_by=request.user,
        )
        modeldata.baseFile = file
        modeldata.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["put"])
    def upload_annotationfile(
        self, request: Request, pk: Optional[str] = None
    ) -> Response:
        modeldata: models.ModelData = self.get_object()
        serializer = None

        check_modeldata_lock(self, modeldata, request.user)
        # check if it is not the first upload
        if modeldata.annotationFile is not None:

            serializer = serializers.AnnotationFileUploadSerializer(
                modeldata.annotationFile, data=request.data
            )
            serializer.is_valid(raise_exception=True)
            serializer.save(uploaded_by=request.user)
        else:
            # no annotation was uploaded yet
            serializer = serializers.AnnotationFileUploadSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            project = modeldata.project
            file = serializer.save(filePath=get_modeldata_file_path(modeldata, project))
            # because File objects have no reference to ModelData,
            # the reference is set here
            modeldata.annotationFile = file
            modeldata.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LoginView(KnoxLoginView):
    authentication_classes = [BasicAuthentication]

    # overwriting post method to delete existing tokens and return a new one
    def post(self, request: Request, format: Optional[str] = None) -> Response:
        now = timezone.now()
        # cannot be of type AnonymousUser because of the permission
        user = cast(KnoxUser, request.user)
        token = user.auth_token_set.filter(expiry__gt=now)
        if token.count() >= 1:
            user.auth_token_set.all().delete()

        return super().post(request, format)


class LogoutView(KnoxLogoutView):
    authentication_classes = [TokenAuthentication]


class RegisterView(GenericAPIView):  # type: ignore
    serializer_class = serializers.UserSerializer

    def post(self, request: Request) -> Response:
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
