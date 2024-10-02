from django.contrib.auth.models import User

from annotator.backend import models, serializers
from annotator.backend.sample_data.sampleData import DATA

LOGGING = True


def log(s: str) -> None:
    if LOGGING:
        print(s)


def createSuperUser() -> None:
    name = "admin"
    password = "1234"

    if User.objects.filter(username=name).exists():
        return

    User.objects.create_superuser(username=name, password=password)


def createSampleUsers() -> None:
    users = DATA["users"]
    for userDict in users:
        if User.objects.filter(username=userDict["username"]).exists():
            print(f"user {userDict['username']} already exists")
            continue
        serializer = serializers.UserSerializer(data=userDict)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        log(f"created user: {user}")


def createSampleProjects() -> None:
    projects = DATA["projects"]
    for projectDict in projects:
        if models.Project.objects.filter(name=projectDict["name"]).exists():
            print(f"project {projectDict['name']} already exists")
            continue
        serializer = serializers.ProjectSerializer(data=projectDict)
        serializer.is_valid(raise_exception=True)
        project = serializer.save(
            owner=User.objects.filter(username=projectDict["ownerName"])[0]
        )
        log(f"created project: {project}")


def createSampleLabels() -> None:
    labels = DATA["labels"]
    for labelDict in labels:
        if models.Label.objects.filter(name=labelDict["name"]).exists():
            print(f"Label {labelDict['name']} already exists")
            continue
        labelDict.update(
            {
                "project_id": models.Project.objects.filter(
                    name=labelDict["projectName"]
                )[0].pk
            }
        )
        serializer = serializers.LabelSerializer(data=labelDict)
        serializer.is_valid(raise_exception=True)
        label = serializer.save()
        log(f"created label: {label}")


def setup() -> None:
    log("creating superuser")
    createSuperUser()

    log("creating users")
    createSampleUsers()

    log("creating projects")
    createSampleProjects()

    log("creating labels")
    createSampleLabels()


setup()
