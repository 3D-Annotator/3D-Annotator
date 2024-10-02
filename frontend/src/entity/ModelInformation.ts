import { type User } from "./User";

/**
 * The Model information
 */
export interface ModelInformation {
	readonly id: number;
	readonly projectId: number;
	readonly name: string;
	readonly owner: User;
	readonly modelType: ModelType;
	readonly modelFile?: FileInformation;
	readonly annotationFile?: FileInformation;
	readonly lastAnnotation?: Date;
	readonly locked?: User;
}

/**
 * The type of a model
 */
export enum ModelType {
	MESH = "mesh",
	POINT_CLOUD = "point_cloud",
}

/**
 * The file information
 */
export interface FileInformation {
	readonly format: string;
	readonly size: number;
	readonly uploadDate: Date;
	readonly uploadedBy: User;
}
