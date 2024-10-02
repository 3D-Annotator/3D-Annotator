import { type ParserResult } from "~annotator/anno3d/AnnotationFileParser";
import { type NamedStream } from "~util/streams/StreamUtils";

/**
 * A FileManager
 */
export interface FileManager {
	/*
	 *   +++ MODEL FILE +++
	 */
	hasModelFiles(): Promise<boolean>;

	/**
	 * Reads a model file
	 */
	readModelFiles(): Promise<File[]>;

	/**
	 * Writes a model file
	 *
	 * @param fileStreams the FileStream
	 */
	writeModelFiles(fileStreams: NamedStream[]): Promise<void>;

	/*
	 *   +++ ANNOTATION FILE +++
	 */
	hasAnnotationFile(): Promise<boolean>;

	/**
	 * Reads AnnotationFile
	 *
	 * @return a ReadableStream
	 */
	readAnnotationFile(): Promise<ReadableStream<Uint8Array>>;

	/**
	 * Read AnnotationData
	 *
	 * @returns the LabeledAnnotationData
	 */
	readAnnotationData(): ParserResult;

	/**
	 * Writes an AnnotationFile
	 *
	 * @param fileStream a ReadableStream
	 */
	writeAnnotationFile(fileStream: ReadableStream<Uint8Array>): Promise<void>;

	/**
	 * Writes AnnotationData
	 *
	 * @param data the array
	 */
	writeAnnotationData(data: Uint16Array): Promise<void>;

	/**
	 * Returns the directory tree
	 */
	getTree(): Promise<string>;
}
