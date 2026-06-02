# 3D Annotator - Demo Deployment Guide

This guide describes how to deploy a demo of the 3D Annotator locally using Docker Compose. It is not intended for deployment in a production environment.

## Prerequisites

Docker and Docker Compose installed on your system.

## Deployment Steps

### 1. Create the `.env` File

Copy the [.env.example](./.env.example) file, name it `.env` and place it right next to the original file in this directory. If you are using a terminal, you can just run:

`cp env.example .env`

Changing the values in the environment file is not necessary. You may change the values, if you know what you are doing.

### 2. Start the Application

Run the following commands in this directory to build and start the containers in detached mode:

`docker pull alpine:latest`

`docker compose up -d`

> [!TIP]
> Depending on your system, you might need to prepend the `sudo` command to each of those commands.

### 3. Access the Web UI

Once the containers are running, you can access the application in your browser (preferably Google Chrome) at the default address http://localhost:8000

(If you manually changed `ANNOTATOR_FRONTEND_PORT` in your `.env` file, use that port instead)

### 4. Stopping the Demo

Run the following command in this directory to stop all containers gracefully:

`docker compose down`

> [!NOTE]
> User profiles, annotations, and uploaded files are safely persisted in Docker volumes. Stopping the demo will not erase your progress.
> To completely wipe the demo data, you can delete the associated volumes by running: `docker volume rm demo_api_media demo_api_db demo_api_static`.
