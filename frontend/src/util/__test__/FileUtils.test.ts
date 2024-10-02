import { vi } from "vitest";
import {
	fileExtension,
	hasFileExtension,
	humanReadableDataSize,
} from "../FileUtils";

describe("FileUtils", () => {
	test("fileExtension()", () => {
		expect(
			fileExtension({
				name: "test.txt",
			})
		).toBe("txt");

		expect(
			fileExtension({
				name: "test",
			})
		).toBe("");

		expect(
			fileExtension({
				name: "test.",
			})
		).toBe("");

		expect(
			fileExtension({
				name: "test.test.txt",
			})
		).toBe("txt");
	});

	test("hasFileExtension()", () => {
		// case insensitivity
		expect(hasFileExtension({ name: "test.txt" }, ["txt"])).toBe(true);
		expect(hasFileExtension({ name: "test.TXT" }, ["txt"])).toBe(true);
		expect(hasFileExtension({ name: "test.TXT" }, ["txt"])).toBe(true);
		expect(hasFileExtension({ name: "test.txt" }, ["TXT"])).toBe(true);
		expect(hasFileExtension({ name: "test.TXT" }, ["TXT"])).toBe(true);

		// with point
		expect(hasFileExtension({ name: "test.txt" }, [".txt"])).toBe(true);
		expect(hasFileExtension({ name: "test.TXT" }, [".txt"])).toBe(true);
		expect(hasFileExtension({ name: "test.TXT" }, [".txt"])).toBe(true);
		expect(hasFileExtension({ name: "test.txt" }, [".TXT"])).toBe(true);
		expect(hasFileExtension({ name: "test.TXT" }, [".TXT"])).toBe(true);

		// false values
		expect(hasFileExtension({ name: "test.txt" }, [""])).toBe(false);
		expect(hasFileExtension({ name: "test.TXT" }, ["t"])).toBe(false);
		expect(hasFileExtension({ name: "test.TXT" }, ["tx"])).toBe(false);
		expect(hasFileExtension({ name: "test.txt" }, ["XT"])).toBe(false);
		expect(hasFileExtension({ name: "test.TXT" }, ["T"])).toBe(false);

		// more than one options
		expect(hasFileExtension({ name: "test.txt" }, ["txt", "png"])).toBe(
			true
		);
		expect(hasFileExtension({ name: "test.png" }, ["txt", "png"])).toBe(
			true
		);
		expect(hasFileExtension({ name: "test.TXT" }, ["txt", ".png"])).toBe(
			true
		);
		expect(hasFileExtension({ name: "test.PNG" }, [".txt", "png"])).toBe(
			true
		);
	});

	test("humanReadableDataSize", () => {
		expect(humanReadableDataSize(0, 2)).toBe("0 bytes");
		expect(humanReadableDataSize(0, 10)).toBe("0 bytes");

		expect(humanReadableDataSize(1023, 2)).toBe("1023 bytes");
		expect(humanReadableDataSize(999, 10)).toBe("999 bytes");

		expect(humanReadableDataSize(1024, 2)).toBe("1.00 KiB");
		expect(humanReadableDataSize(1000, 10)).toBe("1.00 kB");

		expect(humanReadableDataSize(Math.pow(1024, 2), 2)).toBe("1.00 MiB");
		expect(humanReadableDataSize(Math.pow(1000, 2), 10)).toBe("1.00 MB");

		expect(humanReadableDataSize(Math.pow(1024, 2), 2)).toBe("1.00 MiB");
		expect(humanReadableDataSize(Math.pow(1000, 2), 10)).toBe("1.00 MB");

		expect(humanReadableDataSize(Math.pow(1024, 3), 2)).toBe("1.00 GiB");
		expect(humanReadableDataSize(Math.pow(1000, 3), 10)).toBe("1.00 GB");

		expect(humanReadableDataSize(Math.pow(1024, 4), 2)).toBe("1.00 TiB");
		expect(humanReadableDataSize(Math.pow(1000, 4), 10)).toBe("1.00 TB");

		const logSpy = vi.spyOn(console, "error").mockImplementation(() => {
			// do nothing
		});

		expect(humanReadableDataSize(Math.pow(1024, 5), 2)).toBe("");
		expect(logSpy).toHaveBeenCalledTimes(1);

		expect(humanReadableDataSize(Math.pow(1000, 5), 10)).toBe("");
		expect(logSpy).toHaveBeenCalledTimes(2);

		logSpy.mockRestore();
	});
});
