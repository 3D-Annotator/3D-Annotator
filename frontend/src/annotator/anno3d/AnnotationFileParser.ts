import { type Result } from "neverthrow";
import { type LabeledAnnotationData } from "~entity/Annotation";

/**
 * A Parser for Annotation Files
 */
export interface AnnotationFileParser {
	/**
	 * Parses a ReadableStream to AnnotationData
	 *
	 * @param data a ReadableStream streaming the content of the file
	 * @returns AnnotationData
	 */
	parse(data: ReadableStream<Uint8Array>): ParserResult;
}

export type ParserResult = Promise<
	Result<LabeledAnnotationData[], AnnotationFileParserError>
>;

export type AnnotationFileParserError =
	| UnknownLabelError
	| DuplicateLabelError
	| UnsupportedError
	| ParsingError;

interface ParserError {
	code: string;
	lineNumber: number;
	message: string;
	payload?: object;
}

interface UnknownLabelError extends ParserError {
	code: "UNKNOWN_LABEL";
	payload: {
		annotationClass: number;
	};
}

export interface DuplicateLabelError extends ParserError {
	code: "DUPLICATE_LABEL";
	payload: {
		annotationClass: number;
	};
}

export interface UnsupportedError extends ParserError {
	code: "UNSUPPORTED";
	payload: {
		format: string;
		version: string;
	};
}

export interface ParsingError extends ParserError {
	code: "PARSING_ERROR";
	lineNumber: number;
	message: string;
}
