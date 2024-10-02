import { err, ok, type Err, type Result } from "neverthrow";
import { type Label } from "~entity/Annotation";
import { ReadableStreamBufferedLineReader } from "~util/streams/ReadableStreamBufferedLineReader";
import {
	type AnnotationFileParser,
	type ParserResult,
	type UnsupportedError,
} from "./AnnotationFileParser";
import { Format, Version } from "./AnnotationFileSerializer";
import { AnnotationFileParserUTF8v1 } from "./UTF8v1/AnnotationFileParserUTF8v1";

/**
 * The file information
 */
interface FileInformation {
	format: string;
	version: string;
}

/**
 * A generic AnnotationFileParser which reads the file format and version of
 * the file and selects the appropriate AnnotationFileParser.
 */
export class GenericAnnotationFileParser implements AnnotationFileParser {
	private readonly labels: Label[];

	constructor(labels: Label[]) {
		this.labels = labels;
	}

	/**
	 * Parses the file using a dynamically selected AnnotationFileParser.
	 *
	 * @param data a ReadAbleStream streaming the file's content
	 * @returns AnnotationData
	 * @throws an Error if the file's format and version are not supported
	 */
	public async parse(data: ReadableStream<Uint8Array>): ParserResult {
		/*
		 * Tee the Stream to get one stream for determineFileFormatAndVersion()
		 * and one Stream for the parse() method of the specific Parser.
		 */
		const [firstStream, secondStream] = data.tee();
		const { format, version } = await this.determineFileInformation(
			firstStream
		);

		const result = this.getParser({ format, version });

		if (result.isErr()) {
			return err(result.error);
		}

		const parser = result.value;
		return parser.parse(secondStream);
	}

	/**
	 * Extracts information about the format and the version of the file
	 *
	 * @param stream a ReadableStream streaming the file's content
	 * @returns format and version
	 */
	private async determineFileInformation(
		stream: ReadableStream
	): Promise<FileInformation> {
		const reader = new ReadableStreamBufferedLineReader(stream);
		const formatLine = await reader.nextLine();
		const versionLine = await reader.nextLine();
		return {
			format: formatLine.substring(7, 11),
			version: versionLine.substring(8, 11),
		};
	}

	/**
	 * Selects the appropriate AnnotationFileParse by the file's format and version.
	 *
	 * @param info the file's format and version
	 * @returns the appropriate AnnotationFileParser
	 */
	private getParser(
		info: FileInformation
	): Result<AnnotationFileParser, UnsupportedError> {
		switch (info.format) {
			case Format.UTF8:
				return this.getUTF8Parser(info);
			default:
				return this.throwUnsupportedError(info);
		}
	}

	/**
	 * Selects the appropriate AnnotationFileParse for UTF8 files by it's version.
	 *
	 * @param info the file's format and version
	 * @returns the appropriate AnnotationFileParser
	 */
	private getUTF8Parser(
		info: FileInformation
	): Result<AnnotationFileParser, UnsupportedError> {
		switch (info.version) {
			case Version.ONE:
				return ok(new AnnotationFileParserUTF8v1(this.labels));
			default:
				return this.throwUnsupportedError(info);
		}
	}

	private throwUnsupportedError(
		info: FileInformation
	): Err<AnnotationFileParser, UnsupportedError> {
		return err({
			code: "UNSUPPORTED",
			lineNumber: 1,
			message: `The file format '${info.format}' version '${info.version}' is not supported.`,
			payload: {
				format: info.format,
				version: info.version,
			},
		});
	}
}
