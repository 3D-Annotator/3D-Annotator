import { fail } from "assert";
import { ParserUTF8v1 } from "~annotator/anno3d/UTF8v1/AnnotationFileParserUTF8v1";
import { type Label } from "~entity/Annotation";
import { createLabels } from "~entity/__test__/Annotation.test";
import { type BufferedLineReader } from "~util/streams/BufferedLineReader";

describe("AnnotationFileParserUTF8v1", () => {
	let labels: Label[];
	let lines: string[][];
	let parser: ParserUTF8v1;

	beforeEach(() => {
		labels = createLabels(2);
		lines = [["format UTF8", "version 1.0", "count 100"]];
		parser = new ParserUTF8v1(labels);
	});

	test("header and content in separated buffers", async () => {
		lines.push(["label 0 3", "0", "1", "2", "label 1 2", "5", "6"]);

		const reader = new TestLineReader(lines);
		const result = await parser.parse(reader);

		if (result.isErr()) {
			fail("Expected a valid result, not an error.");
		}
		const value = result.value;

		expect(value[0].data).toEqual([0, 1, 2]);
		expect(value[1].data).toEqual([5, 6]);
	});

	test("content in separated buffers", async () => {
		lines.push(["label 0 3", "0"], ["1", "2", "label 1 2", "5", "6"]);

		const reader = new TestLineReader(lines);
		const result = await parser.parse(reader);

		if (result.isErr()) {
			fail("Expected a valid result, not an error.");
		}
		const value = result.value;

		expect(value[0].data).toEqual([0, 1, 2]);
		expect(value[1].data).toEqual([5, 6]);
	});

	test("illegal header", async () => {
		lines.push(["label 0 3", "0", "1", "2", "1 2", "5", "6"]);

		const reader = new TestLineReader(lines);
		const res = await parser.parse(reader);

		if (res.isOk()) {
			fail("Expected an error, not a valid result.");
		}
		const error = res.error;

		expect(error.code).toBe("PARSING_ERROR");
		expect(error.lineNumber).toBe(8);
	});

	test("illegal label", async () => {
		lines.push(["label 0 3", "0", "1", "2", "label 3 2", "5", "6"]);

		const reader = new TestLineReader(lines);
		const res = await parser.parse(reader);

		if (res.isOk()) {
			fail("Expected an error, not a valid result.");
		}
		const error = res.error;

		expect(error.code).toBe("UNKNOWN_LABEL");
		expect(error.lineNumber).toBe(8);
	});
});

class TestLineReader implements BufferedLineReader {
	private lines: string[][];
	private bufferIndex = 0;
	private lineIndex = 0;

	constructor(lines: string[][]) {
		this.lines = lines;
	}

	hasNextLine(): Promise<boolean> {
		if (this.hasBufferedNextLine()) {
			return Promise.resolve(true);
		}

		if (this.bufferIndex < this.lines.length - 1) {
			this.lineIndex = 0;
			this.bufferIndex++;
			return Promise.resolve(this.hasBufferedNextLine());
		}

		return Promise.resolve(false);
	}

	hasBufferedNextLine(): boolean {
		return this.lineIndex < this.lines[this.bufferIndex].length;
	}

	nextLine(): Promise<string> {
		if (this.hasBufferedNextLine()) {
			return Promise.resolve(this.nextBufferedLine());
		}

		this.lineIndex = 0;
		this.bufferIndex++;
		return Promise.resolve(this.nextBufferedLine());
	}

	nextBufferedLine(): string {
		return this.lines[this.bufferIndex][this.lineIndex++];
	}
}
