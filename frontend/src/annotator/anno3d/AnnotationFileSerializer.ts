/**
 * A Serializer for annotation data.
 */
export interface AnnotationFileSerializer {
	/**
	 * Serializes `data`.
	 *
	 * `data` is assumed to be a typed 18 bit array where the index is the
	 * index of the face or point and the value the annotation class.
	 *
	 * @param data the raw data to be serialized
	 * @returns a `ReadableStream` that streams the serialized file
	 */
	serialize(data: Uint16Array): ReadableStream<Uint8Array>;
}

export enum Format {
	UTF8 = "UTF8",
}

export enum Version {
	ONE = "1.0",
}

/**
 * Handles the format of the files header
 *
 * @param format the data format
 * @param version the version of the file
 * @returns returns the header
 */
export function formatFileHeader(format: Format, version: Version): string {
	const formatHeader = `format ${format}`;
	const versionHeader = `version ${version}`;
	return [formatHeader, versionHeader].join("\n");
}
