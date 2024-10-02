import axios from "axios";
import { vi } from "vitest";
import { Errors } from "~api/Errors";
import { LabelsV1 } from "~api/v1/endpoints/Labels";
import { Color, Label } from "~entity/Annotation";

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

const labelResource = {
	label_id: 0,
	annotationClass: 0,
	name: "label",
	color: 0,
};

const label = new Label(0, 0, "label", Color.fromNumber(0));

describe("labels endpoint", () => {
	const labels: LabelsV1 = new LabelsV1(axios.create());

	test("list", async () => {
		mockedAxiosFunctions.get.mockResolvedValueOnce({
			status: 200,
			data: [labelResource],
		});

		const result = await labels.list(0);

		if (result.isErr()) {
			throw new Error("list should not fail");
		}

		const labelsRes = result.value;
		expect(labelsRes).toEqual([label]);
	});

	test("list server error", async () => {
		mockedAxiosFunctions.get.mockResolvedValueOnce({
			status: 500,
		});

		await expect(labels.list(0)).rejects.toThrow();
	});

	test("add", async () => {
		mockedAxiosFunctions.post.mockResolvedValueOnce({
			status: 200,
			data: labelResource,
		});

		const result = await labels.add({
			projectId: 0,
			annotationClass: label.annotationClass,
			name: label.name,
			color: label.color,
		});

		if (result.isErr()) {
			throw new Error("add should not fail");
		}

		const labelsRes = result.value;
		expect(labelsRes).toEqual(label);
	});

	test("add locked", async () => {
		mockedAxiosFunctions.post.mockRejectedValueOnce({
			name: "AxiosError",
			isAxiosError: true,
			response: {
				status: 400,
				config: {},
				data: {
					code: "validation_errors",
					message: "",
					containsErrorList: true,
					errors: {
						annotationClass: [
							{
								// spell-checker:disable-next-line
								code: "annotationclass_not_unique",
								message: "",
							},
						],
					},
				},
			},
		});

		const result = await labels.add({
			projectId: 0,
			annotationClass: label.annotationClass,
			name: label.name,
			color: label.color,
		});

		if (result.isOk()) {
			throw new Error("add should fail");
		}

		const error = result.error;
		expect(error.code).toEqual(Errors.USED_ANNOTATION_CLASS);
	});

	test("detail", async () => {
		mockedAxiosFunctions.get.mockResolvedValueOnce({
			status: 200,
			data: labelResource,
		});

		const result = await labels.detail(0);

		if (result.isErr()) {
			throw new Error("detail should not fail");
		}

		const labelsRes = result.value;
		expect(labelsRes).toEqual(label);
	});

	test("detail server error", async () => {
		mockedAxiosFunctions.get.mockResolvedValueOnce({
			status: 500,
		});

		await expect(labels.detail(0)).rejects.toThrow();
	});

	test("update", async () => {
		mockedAxiosFunctions.put.mockResolvedValueOnce({
			status: 200,
			data: labelResource,
		});

		const result = await labels.update(label.id, label.name, label.color);

		if (result.isErr()) {
			throw new Error("detail should not fail");
		}

		const labelsRes = result.value;
		expect(labelsRes).toEqual(label);
	});

	test("update server error", async () => {
		mockedAxiosFunctions.put.mockResolvedValueOnce({
			status: 500,
		});

		await expect(
			labels.update(0, label.name, label.color)
		).rejects.toThrow();
	});

	test("delete", async () => {
		mockedAxiosFunctions.delete.mockReset();
		mockedAxiosFunctions.delete.mockResolvedValueOnce({
			status: 200,
		});

		await labels.delete(0);

		expect(mockedAxiosFunctions.delete).toHaveBeenCalled();
	});
});
