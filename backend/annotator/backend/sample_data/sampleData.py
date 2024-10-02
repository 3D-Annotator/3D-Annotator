from typing import Any, Iterable, Union


def createUserDict(username: str, email: str, password: str) -> dict[str, str]:
    return {"username": username, "email": email, "password": password}


def createProjectDict(ownerName: str, name: str, description: str) -> dict[str, str]:
    return {"ownerName": ownerName, "name": name, "description": description}


def createLabelDict(
    annotationClass: int, name: str, color: int, projectName: str
) -> dict[str, Union[int, str]]:
    return {
        "annotationClass": annotationClass,
        "name": name,
        "color": color,
        "projectName": projectName,
    }


DATA: dict[str, Iterable[Any]] = {
    "users": [
        createUserDict("testUser2", "test1@test.de", "test12345"),
        createUserDict("testUser3", "test2@test.de", "test12345"),
        createUserDict("testUser4", "test4@test.de", "test12345"),
        createUserDict("testUser5", "test4@test.de", "test12345"),
    ],
    "projects": [
        createProjectDict("testUser2", "testProject1", "Test project 1 description"),
        createProjectDict("testUser2", "testProject2", "Test project 2 description"),
        createProjectDict("testUser3", "testProject3", "Test project 3 description"),
        createProjectDict("testUser4", "testProject4", "Test project 4 description"),
        createProjectDict("testUser5", "testProject5", "Test project 5 description"),
        createProjectDict("testUser5", "testProject6", "Test project 6 description"),
    ],
    "labels": [
        createLabelDict(1, "testLabel1 (red)", 0xFF0000, "testProject1"),
        createLabelDict(2, "testLabel2 (green)", 0x00FF00, "testProject1"),
        createLabelDict(3, "testLabel3 (blue)", 0x0000FF, "testProject1"),
        createLabelDict(4, "testLabel4 (white)", 0xFFFFFF, "testProject1"),
        createLabelDict(5, "testLabel5 (black)", 0x000000, "testProject1"),
        createLabelDict(1, "testLabel6 (purple)", 0xFF00FF, "testProject2"),
        createLabelDict(2, "testLabel7 (yellow)", 0xFFFF00, "testProject2"),
        createLabelDict(3, "testLabel8 (turquoise)", 0x00FFFF, "testProject2"),
    ],
}
