# 3D-Annotator

### An open-source, web-based labeling tool for 3D data

![Annotator](https://github.com/3D-Annotator/3D-Annotator/assets/59662406/b0542488-5f19-456f-9ac7-feb74dbedea1)

https://github.com/user-attachments/assets/442714c4-e078-4bef-a291-96ed16b20616

## Introduction

The 3D-Annotator is an open-source, web-based tool specifically designed for labeling 3D data. It enables users to segment 3D meshes and point clouds into defined classes using different tools. We support both colored as well as textured triangle meshes and to accelerate the processing of large models, the files are cached locally. If there are existing labels, such as those from a pre-annotation task, they can be uploaded as a starting point.
Designed with user-friendliness and collaboration in mind, 3D-Annotator offers straightforward user and project management features. This allows teams to work together on multiple models within a single project, utilizing a shared set of classes for consistent and coherent annotations across the board. This collaborative environment is ideal for academic research, industrial applications, and any other domain where 3D data annotation is crucial.

Currently, our primary focus is on semantic segmentation. However, the tool's modular design allows for easy adaptation to incorporate other methods, such as point cloud classification or 3D bounding boxes.

## Table of Contents

-   [Introduction](#introduction)
-   [Features](#features)
    -   [Annotator](#annotator)
    -   [Project Management](#project-management)
    -   [Annotation File](#annotation-file)
-   [Getting Started](#getting-started)
    -   [Browser Support](#browser-support)
    -   [Dev Server](#dev-server)
    -   [Deploy](#deploy)
-   [Technical Details](#technical-details)
-   [Future Plans](#future-plans)
-   [Authors](#authors)

## Features

### Annotator

#### Tools

3D-Annotator is equipped with a suite of powerful and intuitive tools designed to facilitate precise and efficient labeling of 3D data. These tools cater to various annotation needs, whether you're working with detailed meshes or dense point clouds.

##### 3D-Brush

https://github.com/user-attachments/assets/1921e479-8b05-4e75-9713-bea00377688a

This tool functions as a movable sphere that allows users to paint labels onto the mesh or point cloud. As you maneuver the sphere across your model, all points or triangles within its radius are labeled. This method is particularly useful for quickly annotating large areas with precision and ease.

##### Lasso

https://github.com/user-attachments/assets/30338b53-610b-4bd3-ab3b-bfa9049491fb

The Lasso tool is designed for freeform selection, giving users the ability to label complex shapes and regions. By drawing a freeform shape around the desired area, users can select all points or triangles contained within the lasso in both the foreground and background. This tool supports three modes of selection: Centroid, Intersection, and Contain, allowing for flexible and precise annotation depending on the specific requirements of the task.

##### Polygon (Mesh only)

https://github.com/user-attachments/assets/eb181c6e-2576-4d26-b759-e34929edb5bf

The Polygon tool is perfect for users who need to define more structured and angular selections. Unlike the Lasso tool, the Polygon tool allows users to set specific corner points, creating a multi-sided shape that can be adjusted before finalizing the selection. This method provides greater control over the labeling process, ensuring that only the intended areas are annotated.

##### Brush (Point cloud only)

https://github.com/user-attachments/assets/f53ead9b-6852-44e8-a568-149ef6221f8b

The Brush tool for point clouds operates similarly to the 3D-Brush. It features a movable circle that selects and labels all points within its boundary, regardless of their depth relative to the camera. This tool is ideal for point cloud data, providing a straightforward and effective means of annotating large swathes of points with minimal effort.

#### Menus

##### Labels

The Labels menu displays all the labels defined for the current project. This menu is essential for managing and applying labels during the annotation process.
You can collapse and expand it by clicking on the selected label at the top.
You can select the label you want to use, by clicking on it.
You can toggle the visibility of each label by clicking on the colored dot next to the label.
The lock button lets you lock the label, so the points and triangles, that are already labeled with that label, can`t be overwritten.

##### Views

To switch to predefined perspectives or reset the camera, 6 views are available: top, bottom, left, right, front and back

##### Camera

In the camera menu, you can enable the gizmo and switch the camera between a perspective and an orthographic camera.
You can also change the FOV of the perspective camera.

##### Lighting

The lighting consists of a global light and a directional light, the sun.
You can change the brightness of both individually.
You can either set the position of the sun to one of the 6 axis positions, or set it to the current camera position.
The follow camera switch, lets the sun follow the camera, so it works like a headlight.

### Project management

Project management consists of projects, where users can be members of and upload 3D-models to. Each Project has shared labels, that can be used in all 3D-model annotations. You can upload 3D-models to a project.

#### Create a project

A project has to have a name and a description. The creator of the project is the owner and has special rights in the project. He can add and remove members and can delete the project. Regular members can only leave the project.

#### Add models

You can add 3D-models to a project. A model consist of a model file and optionally a texture and an annotation file. You can either choose multiple files or a whole directory. After your selection, the files will be automatically combined, if the model file name is a prefix of the texture and annotation file. The name of the model defaults to the models file name but may be changed easily. You can also manually change the texture and annotation files or remove them.

#### Add and remove labels

You can add labels for a project. Those are used to annotate the models. Each label has a name, color and an annotation class used in the annotation file.

#### Add and remove members

Collaboration is at the heart of 3D-Annotator’s project management. The owner can invite and remove members

### Annotation File

The created annotations can be exported resulting in a file using the following simple text based file format.

Example:

```
format UTF8
version 1.0
count 10
label 0 3
0
1
2
label 1 1
5
label 2 0
```

Each file starts with two lines describing the format and version of the file format for future extensibility.
The following line contains the total number of points of the point cloud or the number of triangles of the mesh.
Finally all labels and their associated indices of the points/triangles are listed.
Each label starts with the keyword `label`, followed by the labels annotation class and the number of associated points/triangles on the same line separated by spaces.
Each associated index of a point/triangle of that label is then listed on a single line.

## Getting Started

### Browser Support

This project has only been tested on Chrome 86 or newer. Since Firefox and Safari added support for a critical feature in March 2023, they are also expected to work but have not yet been tested enough.

### Dev Server

Follow the READMEs of the respective subfolders `backend` and `frontend`.

### Deploy

Docker files for both backend (api) and frontend (static file server) and the corresponding Docker compose configuration are provided in the `server` subfolder.
There are two Docker compose configurations available for deployment with or without SSL.
Please note, that some browser features used by this application require a secure context. The Docker compose configuration with SSL, uses the [SWAG container](https://docs.linuxserver.io/general/swag/) by [linuxserver.io](https://docs.linuxserver.io) to provide a free SSL certificate.

## Technical Details

This project is build on a simple RESTful backend in python using [django](https://www.djangoproject.com/) and [django-rest-framework](https://github.com/encode/django-rest-framework) and an extensive single page application frontend in TypeScript using [react](https://github.com/facebook/react) and [threejs](https://github.com/mrdoob/three.js). The annotation core is decoupled from react and can be adapted to different frontend frameworks.

### Project Structure

-   backend (django-rest-framework project)
-   frontend (client SPA)
    -   src/annotator (the annotation core)
        -   anno3d (parser and serializer of the export file format)
        -   annotation (everything handling the actual annotation)
        -   files (handling persistent file storage using the origin private file system browser api)
        -   scene (threejs specific code such as camera controls/model loaders etc.)
        -   tools (the tool plugin interface and the actual tools)
    -   src/api (simple axios wrapper to interact with the backend REST API)
    -   src/entity (shared types, interfaces and classes between annotator, api, and ui)
    -   src/ui (the component based ui containing all react code)
    -   src/util (shared utilities)
-   server (docker files for deployment)

## Future plans

-   [ ] add different segmentation types
-   [ ] add support for classification
-   [ ] add support for bounding boxes
-   [ ] add models for pre-annotation
-   [ ] add methods for geometric segmentation to accelerate labeling

## Authors

Fraunhofer IOSB, Karlsruhe

Supervisor: Max Hermann & Stefan Wolf

Created as part of PSE at the Karlsruhe Institute of Technology in the summer term 2022 by

-   [TODO Valentin: Add name]
-   Moritz Hertler
-   [TODO Florian: Add name]
-   [TODO Lukas: Add name]
-   [TODO Linus: Add name]
