import { err, ok } from "neverthrow";
import { type Label, type LabeledAnnotationData } from "~entity/Annotation";
import { wait } from "~util/Timeout";
import { type BufferedLineReader } from "~util/streams/BufferedLineReader";
import { ReadableStreamBufferedLineReader } from "~util/streams/ReadableStreamBufferedLineReader";
import {
	type AnnotationFileParser,
	type ParserResult,
} from "../AnnotationFileParser";

export class AnnotationFileParserUTF8v1 implements AnnotationFileParser {
	private parser: ParserUTF8v1;

	constructor(labels: Label[]) {
		this.parser = new ParserUTF8v1(labels);
	}

	parse(data: ReadableStream<Uint8Array>): ParserResult {
		const reader = new ReadableStreamBufferedLineReader(data);
		return this.parser.parse(reader);
	}
}

/**
 * UTF8 Parser
 */
export class ParserUTF8v1 {
	private readonly labels = new Map<
		number,
		{ used: boolean; label: Label }
	>();

	/**
	 * Constructs a new instance of AnnotationFileParserUTF8v1
	 *
	 * @param labels the label to parse
	 */
	constructor(labels: Label[]) {
		for (const label of labels) {
			this.labels.set(label.annotationClass, {
				used: false,
				label: label,
			});
		}
	}

	private resetLabelsMap() {
		for (const entry of this.labels.values()) {
			entry.used = false;
		}
	}

	/**
	 * Parses a ReadableStream
	 *
	 * @param data a ReadableStream
	 * @returns LabeledAnnotationData
	 */
	public async parse(reader: BufferedLineReader): ParserResult {
		console.time("parser duration");

		this.resetLabelsMap();

		// the first three lines contain file type, version and number of indices which are all ignored
		await reader.nextLine();
		await reader.nextLine();
		await reader.nextLine();

		let lineNumber = 3;
		const annotationData: LabeledAnnotationData[] = [];

		while (await reader.hasNextLine()) {
			const line = reader.nextBufferedLine();
			lineNumber++;

			if (!line.startsWith("label")) {
				return err({
					code: "PARSING_ERROR",
					lineNumber: lineNumber,
					message: `Expected a label header but got: '${line}'.`,
				});
			}

			const { annotationClass, indicesCount } =
				this.parseLabelHeader(line);

			const entry = this.labels.get(annotationClass);
			if (!entry) {
				return err({
					code: "UNKNOWN_LABEL",
					lineNumber: lineNumber,
					message: `There is not label with the annotation class ${annotationClass}.`,
					payload: {
						annotationClass: annotationClass,
					},
				});
			}
			if (entry.used) {
				return err({
					code: "DUPLICATE_LABEL",
					lineNumber: lineNumber,
					message: `The label with the annotation class ${annotationClass} was already parsed.`,
					payload: {
						annotationClass: annotationClass,
					},
				});
			}

			const indices: number[] = [];
			for (let i = 0; i < indicesCount; i++) {
				let index;
				if (reader.hasBufferedNextLine()) {
					index = reader.nextBufferedLine();
				} else {
					// reduce the chance of blocking the main thread with wait
					await wait();
					index = await reader.nextLine();
				}
				lineNumber++;
				indices.push(+index);
			}

			entry.used = true;
			annotationData.push({
				label: entry.label,
				data: indices,
			});
		}

		console.timeEnd("parser duration");
		return ok(annotationData);
	}

	/**
	 * Parses the Label header
	 *
	 * @param line the line to parse
	 * @returns the parsed header information
	 */
	private parseLabelHeader(line: string) {
		const [, annotationClass, indicesCount] = line.split(" ", 3);
		return {
			annotationClass: +annotationClass,
			indicesCount: +indicesCount,
		};
	}
}
