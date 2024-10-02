from django.apps import AppConfig


class AnnotatorConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "annotator.backend"

    def ready(self) -> None:
        import annotator.backend.signals  # noqa: F401
