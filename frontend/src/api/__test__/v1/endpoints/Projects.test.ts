import axios from "axios";
import { vi } from "vitest";
import { ProjectsV1 } from "~api/v1/endpoints/Projects";

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

describe("projects endpoint", () => {
	const description = "description";
	const name = "name";

	const projects: ProjectsV1 = new ProjectsV1(axios.create());

	test("list two projects", async () => {
		mockedAxiosFunctions.get.mockResolvedValueOnce({
			status: 200,
			data: [
				{
					project_id: 0,
					owner: userResource,
					created: date.toISOString(),
					name: name,
					description: description,
				},
				{
					project_id: 1,
					owner: userResource,
					created: date.toISOString(),
					name: name,
					description: description,
				},
			],
		});

		const result = await projects.list(0);

		if (result.isErr()) {
			throw new Error("list projects should not fail");
		}

		const projectsRes = result.value;
		expect(projectsRes).toEqual([
			{
				id: 0,
				owner: user,
				created: date,
				name: name,
				description: description,
				labels: undefined,
				models: undefined,
				users: undefined,
			},
			{
				id: 1,
				owner: user,
				created: date,
				name: name,
				description: description,
				labels: undefined,
				models: undefined,
				users: undefined,
			},
		]);
	});

	test("list server error", async () => {
		mockedAxiosFunctions.get.mockResolvedValueOnce({
			status: 500,
		});

		await expect(projects.list(0)).rejects.toThrow();
	});

	test("add project", async () => {
		const name = "name";
		const description = "description";

		mockedAxiosFunctions.post.mockResolvedValueOnce({
			status: 200,
			data: {
				project_id: 0,
				owner: userResource,
				created: date.toISOString(),
				name: name,
				description: description,
				users: [],
				modelData: [],
				labels: [],
			},
		});

		const result = await projects.add({
			name: name,
			description: description,
		});

		if (result.isErr()) {
			throw new Error("add project should not fail");
		}

		const projectsRes = result.value;
		expect(projectsRes).toEqual({
			id: 0,
			owner: user,
			created: date,
			name: name,
			description: description,
			labels: [],
			models: [],
			users: [],
		});
	});

	test("add project server error", async () => {
		mockedAxiosFunctions.post.mockResolvedValueOnce({
			status: 500,
		});

		await expect(
			projects.add({
				name: name,
				description: description,
			})
		).rejects.toThrow();
	});

	test("illegal name", () => {
		let longName = "";

		for (let i = 0; i < 16; i++) {
			longName += "aaaaaaaaaa";
		}

		expect(() => {
			projects.add({ name: longName, description: description });
		});
	});

	test("detail", async () => {
		mockedAxiosFunctions.get.mockResolvedValueOnce({
			status: 200,
			data: {
				project_id: 0,
				owner: userResource,
				created: date.toISOString(),
				name: name,
				description: description,
				labels: [],
				modelData: [],
				users: [],
			},
		});

		const result = await projects.detail(0);

		if (result.isErr()) {
			throw new Error("detail should not fail");
		}

		const projectsRes = result.value;
		expect(projectsRes).toEqual({
			id: 0,
			owner: user,
			created: date,
			name: name,
			description: description,
			labels: [],
			models: [],
			users: [],
		});
	});

	test("detail server error", async () => {
		mockedAxiosFunctions.get.mockResolvedValueOnce({
			status: 500,
		});

		await expect(projects.detail(0)).rejects.toThrow();
	});

	test("update", async () => {
		mockedAxiosFunctions.put.mockResolvedValueOnce({
			status: 200,
			data: {
				project_id: 0,
				owner: userResource,
				created: date.toISOString(),
				name: name,
				description: description,
				labels: [],
				modelData: [],
				users: [],
			},
		});

		const result = await projects.update(0, {
			name: name,
			description: description,
		});

		if (result.isErr()) {
			throw new Error("update should not fail");
		}

		const projectsRes = result.value;
		expect(projectsRes).toEqual({
			id: 0,
			owner: user,
			created: date,
			name: name,
			description: description,
			labels: [],
			models: [],
			users: [],
		});
	});

	test("update server error", async () => {
		mockedAxiosFunctions.put.mockResolvedValueOnce({
			status: 500,
		});

		await expect(
			projects.update(0, {
				name: name,
				description: description,
			})
		).rejects.toThrow();
	});

	test("delete", async () => {
		mockedAxiosFunctions.delete.mockReset();
		mockedAxiosFunctions.delete.mockResolvedValueOnce({
			status: 200,
		});

		await projects.delete(0);

		expect(mockedAxiosFunctions.delete).toHaveBeenCalled();
	});

	test("list members", async () => {
		mockedAxiosFunctions.get.mockResolvedValueOnce({
			status: 200,
			data: [userResource],
		});

		const result = await projects.listMembers(0);

		if (result.isErr()) {
			throw new Error("list members should not fail");
		}

		const usersRes = result.value;
		expect(usersRes).toEqual([user]);
	});

	test("list members server error", async () => {
		mockedAxiosFunctions.get.mockResolvedValueOnce({
			status: 500,
		});

		await expect(projects.listMembers(0)).rejects.toThrow();
	});

	test("add members", async () => {
		mockedAxiosFunctions.post.mockResolvedValueOnce({
			status: 200,
			data: userResource,
		});

		const result = await projects.addMember(0, 0);

		if (result.isErr()) {
			throw new Error("add member should not fail");
		}

		const usersRes = result.value;
		expect(usersRes).toEqual(user);
	});

	test("add members server error", async () => {
		mockedAxiosFunctions.post.mockResolvedValueOnce({
			status: 500,
		});

		await expect(projects.addMember(0, 0)).rejects.toThrow();
	});

	test("remove members", async () => {
		mockedAxiosFunctions.delete.mockReset();
		mockedAxiosFunctions.delete.mockResolvedValueOnce({
			status: 200,
		});

		await projects.removeMember(0, 0);

		expect(mockedAxiosFunctions.delete).toHaveBeenCalled();
	});
});
