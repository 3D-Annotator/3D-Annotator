import { type Label } from "./Annotation";
import { type ModelInformation } from "./ModelInformation";
import { type User } from "./User";

/**
 * The project information
 */
export interface Project {
	readonly id: number;
	name: string;
	description: string;
	owner: User;
	readonly created: Date;
	users?: User[];
	models?: ModelInformation[];
	labels?: Label[];
}

/**
 * A complete Project
 */
export type FullProject = Required<Project>;
