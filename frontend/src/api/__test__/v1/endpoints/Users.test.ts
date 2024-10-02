import axios from "axios";
import { vi } from "vitest";
import { UsersV1 } from "~api/v1/endpoints/Users";

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

describe("users endpoint", () => {
	const users: UsersV1 = new UsersV1(axios.create());

	test("list two users", async () => {
		mockedAxiosFunctions.get.mockResolvedValueOnce({
			status: 200,
			data: [
				{
					user_id: 0,
					username: "testUser0",
				},
				{
					user_id: 1,
					username: "testUser0",
				},
			],
		});

		const result = await users.list();

		if (result.isErr()) {
			throw new Error("list users should not fail");
		}

		const usersRes = result.value;
		expect(usersRes).toEqual([
			{
				id: 0,
				username: "testUser0",
			},
			{
				id: 1,
				username: "testUser0",
			},
		]);
	});

	test("server error", async () => {
		mockedAxiosFunctions.get.mockResolvedValueOnce({
			status: 500,
		});

		await expect(users.list()).rejects.toThrow();
	});
});
