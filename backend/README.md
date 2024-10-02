# 3d-annotator-backend

## Backend Development Setup

Please make sure you have python 3.10 installed by running `python --version`.

It is highly recommended to use a virtual environment (e.g. venv).

-   **creating a virtual environment**

    `python -m venv .venv`

-   **activating the virtual environment**

    `source ./.venv/bin/activate` (on mac/linux)

    `source ./.venv/Scripts/activate` (on windows)

-   **installing the required packages**

    `pip install -r requirements.txt`

-   **installing git hooks**

    `pre-commit install`

-   **setting up the database**

    `python manage.py makemigrations`\
    `python manage.py migrate`

    These commands should be executed after each change to the model!

-   **creating sample data**

    `echo "import annotator.backend.sample_data.initializeSampleData" | python manage.py shell`

    The sample data may be configured in `annotator/backend/sample_data/sampleData.py`.

-   **starting the development server**

    `python manage.py runserver`

    This starts a lightweight development web server on `127.0.0.1:8000`. For options and further information please refer to the [Django documentation](https://docs.djangoproject.com/en/4.0/ref/django-admin/#runserver).
