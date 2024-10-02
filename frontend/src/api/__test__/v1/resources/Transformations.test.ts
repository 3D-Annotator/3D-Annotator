import { type UserResource } from "~api/v1/resources/Resources";
import {
	transformFileResource,
	transformFullProjectResource,
	transformFullUserResource,
	transformLabelResource,
	transformModelDataResource,
	transformProjectResource,
	transformUserResource,
} from "~api/v1/resources/Transformations";
import { ModelType } from "~entity/ModelInformation";

describe("Transformations", () => {
	let userResource: UserResource;

	beforeEach(() => {
		userResource = {
			user_id: 0,
			username: "Max",
			email: "Max@Mustermann.de",
		};
	});

	test("transformUserResource()", () => {
		const transformedUser = transformUserResource(userResource);

		expect(transformedUser.id).toBe(0);
		expect(transformedUser.username).toBe("Max");
		expect(transformedUser.email).toBe("Max@Mustermann.de");
	});

	test("transformFullUserResource()", () => {
		const fullUserResource = {
			user_id: 0,
			username: "Max",
			email: "Max@Mustermann.de",
		};

		const transformedFullUser = transformFullUserResource(fullUserResource);

		expect(transformedFullUser.id).toBe(0);
		expect(transformedFullUser.username).toBe("Max");
		expect(transformedFullUser.email).toBe("Max@Mustermann.de");
	});

	test("transformProjectResource()", () => {
		const label = {
			label_id: 0,
			annotationClass: 0,
			name: "Object",
			color: 255,
		};

		const baseFileResource = {
			fileFormat: "obj",
			fileSize: 42,
			uploadDate: "01-01-2022",
			uploaded_by: {
				user_id: 1,
				username: "test 1",
			},
		};

		const annotationFileResource = {
			fileFormat: "obj",
			fileSize: 42,
			uploadDate: "01-01-2022",
			uploaded_by: {
				user_id: 2,
				username: "test 2",
			},
		};

		const modelData = {
			modelData_id: 0,
			project_id: 0,
			name: "Model name",
			owner: userResource,
			modelType: "mesh",
			/**
			 * @deprecated will be removed soon
			 */
			annotationType: "index",
			baseFile: baseFileResource,
			annotationFile: annotationFileResource,
			locked: null,
		};

		const projectResource = {
			project_id: 0,
			owner: userResource,
			created: "01-01-2022",
			name: "Test scans",
			description: "Describing words",
			users: [userResource],
			modelData: [modelData],
			labels: [label],
		};

		const transformedProjectResource =
			transformProjectResource(projectResource);

		expect(transformedProjectResource.name).toBe("Test scans");
	});

	test("transformFullProjectResource", () => {
		const label = {
			label_id: 0,
			annotationClass: 0,
			name: "Object",
			color: 255,
		};

		const baseFileResource = {
			fileFormat: "obj",
			fileSize: 42,
			uploadDate: "01-01-2022",
			uploaded_by: {
				user_id: 1,
				username: "test 1",
			},
		};

		const annotationFileResource = {
			fileFormat: "obj",
			fileSize: 42,
			uploadDate: "01-01-2022",
			uploaded_by: {
				user_id: 2,
				username: "test 2",
			},
		};

		const modelData = {
			modelData_id: 0,
			project_id: 0,
			name: "Model name",
			owner: userResource,
			modelType: "mesh",
			/**
			 * @deprecated will be removed soon
			 */
			annotationType: "index",
			baseFile: baseFileResource,
			annotationFile: annotationFileResource,
			locked: null,
		};

		const projectResource = {
			project_id: 0,
			owner: userResource,
			created: "01-01-2022",
			name: "Test scans",
			description: "Describing words",
			users: [userResource],
			modelData: [modelData],
			labels: [label],
		};

		const transformedFullProjectResource =
			transformFullProjectResource(projectResource);

		expect(transformedFullProjectResource.name).toBe("Test scans");
	});

	test("transformModelDataResource()", () => {
		const baseFileResource = {
			fileFormat: "obj",
			fileSize: 42,
			uploadDate: "01-01-2022",
			uploaded_by: {
				user_id: 1,
				username: "test 1",
			},
		};

		const annotationFileResource = {
			fileFormat: "obj",
			fileSize: 42,
			uploadDate: "01-01-2022",
			uploaded_by: {
				user_id: 2,
				username: "test 2",
			},
		};

		const modelData = {
			modelData_id: 0,
			project_id: 0,
			name: "Model name",
			owner: userResource,
			modelType: "mesh",
			/**
			 * @deprecated will be removed soon
			 */
			annotationType: "index",
			baseFile: baseFileResource,
			annotationFile: annotationFileResource,
			locked: null,
		};

		let transformedModelDataResource =
			transformModelDataResource(modelData);

		expect(transformedModelDataResource.modelType).toBe(ModelType.MESH);

		modelData.modelType = "point_cloud";

		transformedModelDataResource = transformModelDataResource(modelData);

		expect(transformedModelDataResource.modelType).toBe(
			ModelType.POINT_CLOUD
		);

		modelData.modelType = "point";

		const res = () => {
			transformedModelDataResource =
				transformModelDataResource(modelData);
		};
		expect(res).toThrowError();
	});

	test("transformLabelResource", () => {
		const label = {
			label_id: 0,
			annotationClass: 0,
			name: "Object",
			color: 255,
		};
		const transformedLabelResource = transformLabelResource(label);

		expect(transformedLabelResource.name).toBe("Object");
	});

	test("transformFileResource()", () => {
		const fileResource = {
			fileFormat: "txt",
			fileSize: 42,
			uploadDate: "01-01-2022",
			uploaded_by: {
				user_id: 2,
				username: "test 2",
			},
		};

		const transformedFileResource = transformFileResource(fileResource);

		expect(transformedFileResource.format).toBe("txt");
	});
});
