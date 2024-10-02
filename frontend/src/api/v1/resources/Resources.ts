export interface UserResource {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	user_id: number;
	username: string;
	email?: string;
}

export type FullUserResource = Required<UserResource>;

export interface LoginResource {
	expiry: string;
	token: string;
	user: FullUserResource;
}
export interface ProjectResource {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	project_id: number;
	owner: UserResource;
	created: string;
	name: string;
	description: string;
	users?: UserResource[];
	modelData?: ModelDataResource[];
	labels?: LabelResource[];
}

export type FullProjectResource = Required<ProjectResource>;

export interface ModelDataResource {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	modelData_id: number;
	// eslint-disable-next-line @typescript-eslint/naming-convention
	project_id: number;
	name: string;
	owner: UserResource;
	modelType: string;
	/**
	 * @deprecated will be removed soon
	 */
	annotationType: string;
	baseFile?: FileResource;
	annotationFile?: FileResource;
	locked: UserResource | null;
}

export interface LabelResource {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	label_id: number;
	annotationClass: number;
	name: string;
	color: number;
}

export interface FileResource {
	fileFormat: string;
	fileSize: number;
	uploadDate: string;
	// eslint-disable-next-line @typescript-eslint/naming-convention
	uploaded_by: UserResource;
}
