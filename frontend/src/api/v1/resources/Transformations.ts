import { Color, Label } from "~entity/Annotation";
import {
	ModelType,
	type FileInformation,
	type ModelInformation,
} from "~entity/ModelInformation";
import { type FullProject, type Project } from "~entity/Project";
import { type FullUser, type User } from "~entity/User";
import { PREFIX } from "../APIv1";
import {
	type FileResource,
	type FullProjectResource,
	type FullUserResource,
	type LabelResource,
	type ModelDataResource,
	type ProjectResource,
	type UserResource,
} from "./Resources";

/*
 *   +++ USER RESOURCE +++
 */

// UserResource => User

export function transformUserResource(user: UserResource): User {
	return {
		id: user.user_id,
		username: user.username,
		email: user.email,
	};
}

// FullUserResource => FullUser

export function transformFullUserResource(user: FullUserResource): FullUser {
	return transformUserResource(user) as FullUser;
}

/*
 *   +++ PROJECT RESOURCE +++
 */

// ProjectResource => Project

export function transformProjectResource(project: ProjectResource): Project {
	const users = project.users
		? transformArray(project.users, transformUserResource)
		: undefined;
	const models = project.modelData
		? transformArray(project.modelData, transformModelDataResource)
		: undefined;
	const labels = project.labels
		? transformArray(project.labels, transformLabelResource)
		: undefined;
	return {
		id: project.project_id,
		name: project.name,
		description: project.description,
		owner: transformUserResource(project.owner),
		created: new Date(project.created),
		users: users,
		models: models,
		labels: labels,
	};
}

// FullProjectResource => FullProject

export function transformFullProjectResource(
	project: FullProjectResource
): FullProject {
	return transformProjectResource(project) as FullProject;
}

/*
 *   +++ MODEL DATA RESOURCE +++
 */

// ModelDataResource => ModelInformation

export function transformModelDataResource(
	model: ModelDataResource
): ModelInformation {
	const modelFile = model.baseFile
		? transformFileResource(model.baseFile)
		: undefined;
	const annotationFile = model.annotationFile
		? transformFileResource(model.annotationFile)
		: undefined;
	const locked = model.locked
		? transformUserResource(model.locked)
		: undefined;

	return {
		id: model.modelData_id,
		projectId: model.project_id,
		name: model.name,
		owner: transformUserResource(model.owner),
		modelType: transformModelType(model.modelType),
		modelFile: modelFile,
		annotationFile: annotationFile,
		lastAnnotation: annotationFile?.uploadDate,
		locked: locked,
	};
}

function transformModelType(modelType: string): ModelType {
	switch (modelType) {
		case ModelType.MESH:
			return ModelType.MESH;
		case ModelType.POINT_CLOUD:
			return ModelType.POINT_CLOUD;
		default:
			throw new Error(
				`${PREFIX}Transformation failed: Could not convert ${modelType} into a ModelType`
			);
	}
}

/*
 *   +++ LABEL RESOURCE +++
 */

// LabelResource =>  Label

export function transformLabelResource(label: LabelResource): Label {
	return new Label(
		label.label_id,
		label.annotationClass,
		label.name,
		Color.fromNumber(label.color)
	);
}

/*
 *   +++ FILE RESOURCE +++
 */

// FileResource => FileInformation

export function transformFileResource(file: FileResource): FileInformation {
	const user = file.uploaded_by
		? transformUserResource(file.uploaded_by)
		: {
				id: -1,
				username: "",
		  };
	return {
		format: file.fileFormat,
		size: file.fileSize,
		uploadDate: new Date(file.uploadDate),
		uploadedBy: user,
	};
}

/*
 *   +++ HELPER METHODS +++
 */

export function transformArray<Resource, Entity>(
	resources: Resource[],
	transformer: (data: Resource) => Entity
): Entity[] {
	const array: Entity[] = [];
	for (const resource of resources) {
		array.push(transformer(resource));
	}
	return array;
}
