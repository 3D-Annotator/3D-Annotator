import {
	validateNonNumericString,
	validateString,
} from "~api/v1/validation/Validation";

describe("validation", () => {
	test("string too large", () => {
		expect(() => {
			validateString("abc", "name", 2);
		}).toThrow("name");
	});

	test("string too short", () => {
		expect(() => {
			validateString("a", "name", 3, 2);
		}).toThrow("name");
	});

	test("non numeric", () => {
		expect(() => {
			validateNonNumericString("1234", "name");
		}).toThrow("name");
	});
});
