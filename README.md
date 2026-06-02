# 3D-Annotator

### An open-source, web-based labeling tool for 3D data

![Annotator](https://github.com/3D-Annotator/3D-Annotator/assets/59662406/b0542488-5f19-456f-9ac7-feb74dbedea1)






https://github.com/user-attachments/assets/63018444-dab7-4e17-9a53-49f16f5cb2fb



# Introduction

The 3D‑Annotator is an open‑source, web‑based tool for labeling 3D data. It enables users to segment 3D meshes and point clouds into defined classes using different tools. We support both colored and textured meshes, and to accelerate the processing of large models, files are cached locally. If there are existing labels, such as those from a pre‑annotation task, they can be uploaded as a starting point.
Annotation modes can be selected per model to keep workflows clear and consistent: **triangle annotation** (mesh), **per‑pixel texture annotation** (mesh), and **point‑cloud annotation** (point clouds). Per‑pixel texture annotation labels texture pixels rather than triangles, enabling crisper detail at a given mesh resolution or high‑quality results with low‑poly geometry. A variety of tools supports different selection strategies across modes.
Designed with user‑friendliness and collaboration in mind, 3D‑Annotator offers straightforward user and project management features. This allows teams to work together on multiple models within a single project, utilizing a shared set of classes for consistent and coherent annotations, well suited for academic research and industrial applications.
Currently, our primary focus is on semantic segmentation. However, the tool’s modular design allows for easy adaptation to incorporate other methods, such as point cloud classification or 3D bounding boxes. Annotations can be exported as PNG or in our annotation-file format.

# Table of Contents

- [Introduction](#introduction)
- [Features](#features)
  - [Overview 3D-Annotator](#overview-3d-annotator)
  - [Project management](#project-management)
  - [Annotation file](#annotation-file)
- [Getting started](#getting-started)
  - [Browser support](#browser-support)
  - [Demo](#demo)
  - [Dev server](#dev-server)
  - [Deploy](#deploy)
- [Technical details](#technical-details)
- [Dataset references](#dataset-references)
- [Future plans](#future-plans)
- [Authors](#authors)

# Features

## Overview 3D-Annotator

![AnnotatorOverview](https://github.com/user-attachments/assets/3796a2d3-af61-46d7-b647-87bbb9a64c52)

### Tools

3D-Annotator is equipped with a suite of powerful and intuitive tools designed to facilitate precise and efficient labeling of 3D data. These tools cater to various annotation needs, whether you're working with detailed meshes or dense point clouds.

#### 3D-Brush



https://github.com/user-attachments/assets/61221b59-2589-4fed-8325-4777a1935f9e



This tool functions as a movable sphere that allows users to paint labels onto the mesh or point cloud. As you maneuver the sphere across your model, all points, triangles or pixels within its radius are labeled. This method is particularly useful for quickly annotating large areas with precision.

#### Lasso



https://github.com/user-attachments/assets/1283bf76-4e64-42a0-9549-8d7f8b8c0750



The Lasso tool is designed for freeform selection, giving users the ability to label complex shapes and regions. By drawing a freeform shape around the desired area, users can select all points, triangles or pixels contained† within the lasso in both the foreground and background.

† Mesh supports Centroid, Intersection, and Contain modes


#### Polygon



https://github.com/user-attachments/assets/c7965d46-219d-456f-a961-0fb874f7de1d



The Polygon tool provides structured selections. Set corner points to create a polygon and adjust it before finalizing to ensure only the intended area is labeled. This method provides greater control over the labeling process, ensuring that only the intended areas are annotated.

#### Brush (Point cloud only)



https://github.com/user-attachments/assets/e422b7ac-9d99-4922-a95c-f3ecf3ac6ebe



The Brush tool for point clouds operates similarly to the 3D-Brush. It features a movable circle that selects and labels all points within its boundary, regardless of their depth relative to the camera. This tool is ideal for point cloud data, providing a straightforward and effective means of annotating large swathes of points with minimal effort.

#### Fill



https://github.com/user-attachments/assets/5193e6c1-9476-41d6-80c0-d008e1e63920




A one‑click action that assigns the selected label to all pixels. Elements already labeled with locked labels are not overwritten.

#### Triangle (Texture (per‑pixel) only)



https://github.com/user-attachments/assets/56297d35-65b9-4155-90d0-863c06642ffe




Click a triangle of the mesh to label all texture pixels mapped to that triangle. Works like triangle labeling in mesh mode, but writes the label to the corresponding pixels instead of the triangle element.

#### Pixel-Brush (Texture (per‑pixel) only)



https://github.com/user-attachments/assets/55924a04-e03d-4993-8c81-3aa999e6f18b



Labels exactly one texture pixel at the mouse cursor. Useful for fixing the last little details.

### Menus

#### Settings

The main settings menu, lets you adjust settings for each tool, and some general settings.
All the settings are client-side and persistent so they stay the same after reloading. You can revert to the default by double-clicking at the default value.

#### Labels

The Labels menu displays all the labels defined for the current project. This menu is essential for managing and applying labels during the annotation process.
You can collapse and expand it by clicking on the selected label at the top.
You can select the label you want to use, by clicking on it.
You can toggle the visibility of each label by clicking on the colored dot next to the label.
The lock button lets you lock the label, so the points and triangles, that are already labeled with that label, can`t be overwritten.
It also has an opacity slider to control the opacity of the label colors, to see the texture better.

#### Views

To switch to predefined perspectives or reset the camera, 6 views are available: top, bottom, left, right, front and back

#### Camera

In the camera menu, you can enable the gizmo and switch the camera between a perspective and an orthographic camera.
You can also change the FOV of the perspective camera.

#### Lighting

The lighting menu consists of a global light and a directional light, the sun.
You can change the brightness of both individually.
You can either set the position of the sun to one of the 6 axis positions, or set it to the current camera position.
The follow camera switch, lets the sun follow the camera, so it works like a headlight.

#### Points (point cloud only)

The points menu has a slider to adjust the size of the points.

## Project management

Project management consists of projects, where users can add members and upload 3D-models. Each Project has shared labels, that can be used in all 3D-model annotations.

### Create project

A project has to have a name and a description. The creator of the project is the owner and has special rights in the project. He can add and remove members and can delete the project. Regular members can only leave the project.

### Add models

You can add 3D-models to a project. A model consist of a model file and optionally a texture and an annotation file. You can either choose multiple files or a whole directory. After your selection, the files will be automatically combined, if the model file name is a prefix of the texture and annotation file. The name of the model defaults to the models file name but can be changed easily. You can also manually change the texture and annotation files or remove them. Texture files need to be .jpeg. Annotation files can be either .anno3d, .txt or in mesh texture mode also .png. In mesh texture mode, the texture and annotation files can only have up the maximum size of the html canvas, which can be found here: https://jhildenbiddle.github.io/canvas-size/#/?id=test-results

### Add and remove labels

You can add labels for a project. Those are used to annotate the models. Each label has a name, color and an annotation class used in the annotation file. You have to add all labels that are used in a model in order to open it.

### Add and remove members

Collaboration is at the heart of 3D-Annotator’s project management. The owner can invite and remove members.

## Annotation File

Annotations can be imported and exported from or into a simple file format called anno3d.
The file format is designed to be easily serializable and parsable.

There are three different possible targets. Support depends on the annotation mode (point-cloud, mesh, texture):

- UTF-8 (supported by all modes, human-readable)\
  Refer to the [spec](./frontend/src/anno3d/v2/targets/utf8/Specification.md) for detailed information.
- Binary (supported by all modes)\
  Refer to the [spec](./frontend/src/anno3d/v2/targets/binary/Specification.md) for detailed information.
- PNG (supported only by texture mode, human-readable depending on the configuration)\
  Refer to the [spec](./frontend/src/anno3d/v2/targets/png/Specification.md) for detailed information.

Earlier version of the 3D-Annotator used a now deprecated version of anno3d that only supported UTF-8.
A simple description can be found [here](./frontend/src/anno3d/v1/Specification.md).
This old version is still supported for imports but can not be exported anymore.

# Getting started

## Browser support

This project has only been tested on Chrome 86 or newer. Since Firefox and Safari added support for a critical feature in March 2023, they are also expected to work but have not yet been tested enough.

## Demo

For a quick and easy demo, please refer to [this](./demo/README.md) guide.

## Dev server

Follow the READMEs of the respective subfolders [backend](./backend/README.md) and [frontend](./frontend/README.md).

## Deploy

Docker files for both backend (api) and frontend (static file server) and the corresponding Docker compose configuration are provided in the [deployment](./deployment/) subfolder.
Please note, that some browser features used by this application require a secure context (https) and cross origin isolation.

# Technical details

This project is build on a simple RESTful backend in python using [django](https://www.djangoproject.com/) and [django-rest-framework](https://github.com/encode/django-rest-framework) and an extensive single page application frontend in TypeScript using [react](https://github.com/facebook/react) and [threejs](https://github.com/mrdoob/three.js). The annotation core is decoupled from react and can be adapted to different frontend frameworks.

## Project structure

- backend (django-rest-framework project)
- frontend (client SPA)
  - src/anno3d (parser and serializer of the export file format)
  - src/annotator (the annotation core)
    - annotation (everything handling the actual annotation)
    - files (helpers to manage access to the persistent file cache)
    - scene (threejs specific code such as camera controls/model loaders etc.)
    - tools (the tool plugin interface and the actual tools)
  - src/api (simple axios wrapper to interact with the backend REST API)
  - src/cache (persistent file caching using the origin private file system browser api)
  - src/codecs (cache and worker codecs for application entities and three js primitives)
  - src/entity (shared types, interfaces and classes between annotator, api, and ui)
  - src/events (helpers for event subscription and dispatching)
  - src/i18n (internationalization)
  - src/settings (signal based settings with persistence)
  - src/ui (the component based ui containing all react code)
  - src/util (shared utilities)
  - src/workers (worker orchestration and declarative context transfers)
- deployment (docker files for deployment)

# Dataset references

## H3D dataset
https://ifpwww.ifp.uni-stuttgart.de/benchmark/hessigheim/default.aspx

```bibtex
@article{KOLLE2021100001,
         title = {The Hessigheim 3D (H3D) benchmark on semantic segmentation of high-resolution 3D point clouds and textured meshes from UAV LiDAR and Multi-View-Stereo},
         journal = {ISPRS Open Journal of Photogrammetry and Remote Sensing},
         author = {Michael Kölle and Dominik Laupheimer and Stefan Schmohl and Norbert Haala and Franz Rottensteiner and Jan Dirk Wegner and Hugo Ledoux},
}
```

## UseGeo dataset
https://usegeo.fbk.eu/

```bibtex
@article{NEX2024100070,
         title = {UseGeo - A UAV-based multi-sensor dataset for geospatial research},
         journal = {ISPRS Open Journal of Photogrammetry and Remote Sensing},
         author = {F. Nex and E.K. Stathopoulou and F. Remondino and M.Y. Yang and L. Madhuanand and Y. Yogender and B. Alsadik and M. Weinmann and B. Jutzi and R. Qin}
}

@article{Hermann2024usegeo,
         title   = {Depth estimation and 3D reconstruction from UAV-borne imagery: Evaluation on the UseGeo dataset},
         journal = {ISPRS Open Journal of Photogrammetry and Remote Sensing},
         author  = {M. Hermann and M. Weinmann and F. Nex and E.K. Stathopoulou and F. Remondino and B. Jutzi and B. Ruf},
}
```

# Future plans

- [x] add different segmentation types
- [ ] add support for classification
- [ ] add support for bounding boxes
- [ ] add models for pre-annotation
- [ ] add methods for geometric segmentation to accelerate labeling

# Authors

The project is currently maintained and developed by:
- [Moritz Hertler](https://github.com/moritzhertler)
- [Linus Wilkins](https://github.com/linuswilkins)
- [Max Hermann](https://github.com/max-hermann)

This project was initiated as part of PSE at the Karlsruhe Institute of Technology (KIT) in the summer term of 2022 by

- Valentin Dold
- Moritz Hertler
- Florian Hüther
- Lukas Kirsch
- Linus Wilkins

Supervisors: Max Hermann & Stefan Wolf
Fraunhofer IOSB, Karlsruhe
