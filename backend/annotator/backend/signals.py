from django.core.files.storage import default_storage, Storage

from typing import Union, Type, Any

from django.db.models import Model
from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_out
from django.contrib.auth.models import User
from rest_framework.request import Request

from . import models
from annotator.backend.utils import unlock_modeldata_from_user


# ensures that the Files of the ModelData are deleted with it
@receiver(post_delete, sender=models.ModelData)
def post_delete_modeldata_handler(
    sender: Union[Type[Model], str],
    instance: models.ModelData,
    **kwargs: dict[str, Any]
) -> None:
    if instance.annotationFile is not None:
        instance.annotationFile.delete()
    if instance.baseFile is not None:
        path = instance.baseFile.filePath
        storage: Storage = default_storage
        instance.baseFile.delete()
        # delete modelData directory
        storage.delete(path)
        path = path.rstrip("/")
        index = path.rfind("/")
        project_path = path[:index]
        files = storage.listdir(project_path)
        # if the project directory is empty, delete it
        if len(files[0]) == 0 and len(files[1]) == 0:
            storage.delete(project_path)


# deletes the file of the File model from the disk
@receiver(post_delete, sender=models.File)
def post_delete_file_handler(
    sender: Union[Type[Model], str], instance: models.File, **kwargs: dict[str, Any]
) -> None:
    instance.file.delete()


@receiver(user_logged_out)
def user_logout_handler(
    sender: Union[Type[Model], str],
    request: Request,
    user: User,
    **kwargs: dict[str, Any]
) -> None:
    unlock_modeldata_from_user(user)
