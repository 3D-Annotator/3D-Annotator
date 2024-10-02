from django.urls import path, include, re_path
from . import views
from rest_framework import routers

baseRouter = routers.DefaultRouter()
baseRouter.register(r"projects", views.ProjectViewSet)
baseRouter.register(r"users", views.UserViewSet, basename="user")
baseRouter.register(r"labels", views.LabelViewSet)
baseRouter.register(r"modelData", views.ModelDataViewSet)

advancedRouter = routers.DefaultRouter()
advancedRouter.register(r"users", views.ProjectUserViewSet, basename="projectuser")

urlpatterns = [
    path("v1/", include(baseRouter.urls)),
    path("v1/login/", views.LoginView.as_view(), name="login"),
    path("v1/logout/", views.LogoutView.as_view(), name="logout"),
    path("v1/register/", views.RegisterView.as_view(), name="register"),
    path("v1/projects/<int:project_id>/", include(advancedRouter.urls)),
    path(
        "v1/modelData/<int:pk>/baseFile",
        views.FileViewSet.as_view(
            {"put": "upload_basefile", "get": "download_basefile"}
        ),
        name="basefile",
    ),
    path(
        "v1/modelData/<int:pk>/annotationFile",
        views.FileViewSet.as_view(
            {"put": "upload_annotationfile", "get": "download_annotationfile"}
        ),
        name="annotationfile",
    ),
    re_path(
        "v1/^projects/(?P<user_id>=[1-9]+)/$",
        views.ProjectViewSet.as_view({"get": "list"}),
    ),
    re_path(
        "v1/^modelData/(?P<project_id>=[1-9]+&P<user_id>=[1-9]+)/$",
        views.ModelDataViewSet.as_view({"get": "list"}),
    ),
    re_path(
        "v1/^labels/(?P<project_id>=[1-9]+&P<user_id>=[1-9]+)/$",
        views.LabelViewSet.as_view({"get": "list"}),
    ),
]
