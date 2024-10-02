import axios from "axios";
import { vi } from "vitest";
import { Errors } from "~api/Errors";
import { ModelsV1 } from "~api/v1/endpoints/Models";
import { ModelType } from "~entity/ModelInformation";

const mockedAxiosFunctions = vi.hoisted(() => ({
	get: vi.fn(),
	post: vi.fn(),
	put: vi.fn(),
	delete: vi.fn(),
}));

vi.mock("axios", async (importActual) => {
	const actual = await importActual<typeof import("axios")>();

	const mockAxios = {
		default: {
			...actual.default,
			create: vi.fn(() => ({
				...actual.default.create(),
				get: mockedAxiosFunctions.get,
				post: mockedAxiosFunctions.post,
				put: mockedAxiosFunctions.put,
				delete: mockedAxiosFunctions.delete,
			})),
		},
	};

	return mockAxios;
});

const userResource = { user_id: 0, username: "testUser0" };
const user = { id: 0, username: "testUser0", email: undefined };

const date = new Date();

const fileResource = {
	fileFormat: "zip",
	fileSize: 100,
	uploadDate: date.toISOString(),
	uploaded_by: {
		user_id: 1,
		username: "test 1",
	},
};

const file = {
	format: "zip",
	size: 100,
	uploadDate: date,
	uploadedBy: {
		id: 1,
		username: "test 1",
	},
};

const modelResource = {
	modelData_id: 0,
	project_id: 0,
	name: "name",
	owner: userResource,
	modelType: "mesh",
	annotationType: "index",
	baseFile: fileResource,
	annotationFile: fileResource,
	locked: null,
};

const model = {
	id: 0,
	projectId: 0,
	name: "name",
	owner: user,
	modelType: ModelType.MESH,
	modelFile: file,
	annotationFile: file,
	lastAnnotation: date,
	locked: undefined,
};

describe("models endpoint", () => {
	const models: ModelsV1 = new ModelsV1(axios.create());

	test("list", async () => {
		mockedAxiosFunctions.get.mockResolvedValueOnce({
			status: 200,
			data: [modelResource],
		});

		const result = await models.list(0);

		if (result.isErr()) {
			throw new Error("list should not fail");
		}

		const modelRes = result.value;
		expect(modelRes).toEqual([model]);
	});

	test("list server error", async () => {
		mockedAxiosFunctions.get.mockResolvedValueOnce({
			status: 500,
		});

		await expect(models.list(0)).rejects.toThrow();
	});

	test("add", async () => {
		mockedAxiosFunctions.post.mockResolvedValueOnce({
			status: 200,
			data: modelResource,
		});

		const result = await models.add({
			projectId: model.id,
			name: model.name,
			modelType: model.modelType,
		});

		if (result.isErr()) {
			throw new Error("add should not fail");
		}

		const modelRes = result.value;
		expect(modelRes).toEqual(model);
	});

	test("add server error", async () => {
		mockedAxiosFunctions.post.mockResolvedValueOnce({
			status: 500,
		});

		await expect(
			models.add({
				projectId: model.id,
				name: model.name,
				modelType: model.modelType,
			})
		).rejects.toThrow();
	});

	test("detail", async () => {
		mockedAxiosFunctions.get.mockResolvedValueOnce({
			status: 200,
			data: modelResource,
		});

		const result = await models.detail(0);

		if (result.isErr()) {
			throw new Error("detail should not fail");
		}

		const modelRes = result.value;
		expect(modelRes).toEqual(model);
	});

	test("detail server error", async () => {
		mockedAxiosFunctions.get.mockResolvedValueOnce({
			status: 500,
		});

		await expect(models.detail(0)).rejects.toThrow();
	});

	test("update", async () => {
		mockedAxiosFunctions.put.mockResolvedValueOnce({
			status: 200,
			data: modelResource,
		});

		const result = await models.update(0, model.name);

		if (result.isErr()) {
			throw new Error("update should not fail");
		}

		const modelRes = result.value;
		expect(modelRes).toEqual(model);
	});

	test("update server error", async () => {
		mockedAxiosFunctions.put.mockResolvedValueOnce({
			status: 500,
		});

		await expect(models.update(0, model.name)).rejects.toThrow();
	});

	test("delete", async () => {
		mockedAxiosFunctions.delete.mockReset();
		mockedAxiosFunctions.delete.mockResolvedValueOnce({
			status: 200,
		});

		await models.delete(0);

		expect(mockedAxiosFunctions.delete).toHaveBeenCalled();
	});

	test("lock", async () => {
		mockedAxiosFunctions.put.mockReset();
		mockedAxiosFunctions.put.mockResolvedValueOnce({
			status: 200,
			data: {},
		});

		const result = await models.lock(0, true);

		if (result.isErr()) {
			throw new Error("add should not fail");
		}

		expect(mockedAxiosFunctions.put).toHaveBeenCalled();
	});

	test("lock locked", async () => {
		mockedAxiosFunctions.put.mockRejectedValueOnce({
			name: "AxiosError",
			isAxiosError: true,
			response: {
				status: 403,
				config: {},
				data: {
					// spell-checker:disable-next-line
					code: "modeldata_locked",
					message: "",
					containsErrorList: false,
				},
			},
		});

		const result = await models.lock(0, true);

		if (result.isOk()) {
			throw new Error("add should fail");
		}

		const error = result.error;
		expect(error.code).toEqual(Errors.LOCKED);
	});
});
