#!/bin/sh

python manage.py collectstatic --noinput

python manage.py migrate --noinput
 
python manage.py createsuperuser --noinput

if [ ${DEBUG} = "true" ]; then
    python manage.py runserver
else 
    gunicorn annotator.wsgi:application --bind 0.0.0.0:8000
fi

exec "$@"
