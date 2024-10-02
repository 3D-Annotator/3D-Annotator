import { type Label } from "~entity/Annotation";
import { type BufferedWriter } from "~util/streams/BufferedWriter";
import { WritableStreamBufferedWriter } from "~util/streams/WritableStreamBufferedWriter";
import {
	Format,
	Version,
	formatFileHeader,
	type AnnotationFileSerializer,
} from "../AnnotationFileSerializer";

export class AnnotationFileSerializerUTF8v1
	implements AnnotationFileSerializer
{
	private serializer: SerializerUTF8v1;

	constructor(labels: Label[]) {
		this.serializer = new SerializerUTF8v1(labels);
	}

	/**
	 * Serializes data to a ReadableStream
	 *
	 * @param data the data
	 * @returns the ReadableStream
	 */
	public serialize(data: Uint16Array): ReadableStream<Uint8Array> {
		const { readable, writable } = new TransformStream<
			Uint16Array,
			Uint8Array
		>();
		const writer = new WritableStreamBufferedWriter(writable);
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		this.serializer.serializeData(data, writer);
		return readable;
	}
}

/**
 * An {@link AnnotationFileSerializer} creating UTF-8 encoded files for anno3d
 * {@link Version.ONE}.
 */
export class SerializerUTF8v1 {
	private readonly encoder: TextEncoder = new TextEncoder();
	private readonly labels: Label[];
	private writer?: BufferedWriter;

	/**
	 * Constructs a new Serializer.
	 *
	 * @param labels an array of all {@link Label Labels} that will be
	 *               referenced by the `data` array passed to
	 *               {@link serialize()}
	 */
	constructor(labels: Label[]) {
		this.labels = labels;
	}

	/**
	 * Serializes buffered Annotation data
	 *
	 * @param data a the buffered data
	 */
	public async serializeData(
		data: Uint16Array,
		writer: BufferedWriter
	): Promise<void> {
		this.writer = writer;

		console.time("serialize duration");
		const fileHeader = formatFileHeader(Format.UTF8, Version.ONE);
		await this.writeLine(fileHeader);
		await this.writeLine(`count ${data.length}`);

		for (const label of this.labels) {
			const indices = this.getIndices(label.annotationClass, data);
			await this.writeLine(
				`label ${label.annotationClass} ${indices.length}`
			);

			for (const index of indices) {
				const promise = this.writeLineSync(`${index}`);
				if (promise) {
					await promise;
				}
			}
		}
		await this.writer.close();
		console.timeEnd("serialize duration");
	}

	/**
	 * Writes a Line async
	 *
	 * @param string the string to write
	 * @returns the promise
	 */
	private async writeLine(string: string): Promise<void> {
		const promise = this.writeLineSync(string);
		if (promise) {
			return promise;
		}
	}

	/**
	 * Writes a Line in sync
	 *
	 * @param string the string to write
	 */
	private writeLineSync(string: string) {
		const encoded = this.encoder.encode(string + "\n");
		return this.writer!.writeSync(encoded);
	}

	/**
	 * Returns the indices that have been annotated with the given annotationClass.
	 *
	 * @param annotationClass the annotationClass
	 * @param data an array representing a map of index => annotationClass
	 * @returns the indices annotated with the given annotationClass
	 */
	private getIndices(annotationClass: number, data: Uint16Array): number[] {
		const indices: number[] = [];
		for (let i = 0; i < data.length; i++) {
			if (data[i] === annotationClass) {
				indices.push(i);
			}
		}
		return indices;
	}
}
