# Generated by Django 4.0.6 on 2022-09-23 02:17

import annotator.backend.models
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="File",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("filePath", models.CharField(max_length=255)),
                ("uploadDate", models.DateTimeField(auto_now=True)),
                ("fileFormat", models.CharField(max_length=30)),
                (
                    "file",
                    models.FileField(upload_to=annotator.backend.models.get_file_path),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Project",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=100)),
                ("description", models.TextField(max_length=255)),
                ("created", models.DateTimeField(auto_now_add=True)),
                (
                    "owner",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ownedProjects",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "users",
                    models.ManyToManyField(
                        blank=True, related_name="projects", to=settings.AUTH_USER_MODEL
                    ),
                ),
            ],
            options={
                "ordering": ["created"],
            },
        ),
        migrations.CreateModel(
            name="ModelData",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=100)),
                ("modelType", models.CharField(max_length=30)),
                ("annotationType", models.CharField(max_length=30)),
                (
                    "annotationFile",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to="backend.file",
                    ),
                ),
                (
                    "baseFile",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to="backend.file",
                    ),
                ),
                (
                    "locked",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="lockedModels",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "owner",
                    models.ForeignKey(
                        on_delete=models.SET(annotator.backend.models.get_adopter_user),
                        related_name="modelData",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="modelData",
                        to="backend.project",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Label",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=100)),
                ("annotationClass", models.IntegerField()),
                ("color", models.IntegerField()),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="labels",
                        to="backend.project",
                    ),
                ),
            ],
        ),
    ]
