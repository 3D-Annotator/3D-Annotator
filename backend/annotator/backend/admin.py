from django.contrib import admin
from . import models


admin.site.register(models.Project)
admin.site.register(models.ModelData)
admin.site.register(models.Label)
admin.site.register(models.File)
