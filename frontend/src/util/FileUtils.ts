export async function writeStreamToLocalFileSystem(
	stream: ReadableStream<Uint8Array>,
	options?: SaveFilePickerOptions
) {
	const handle = await window.showSaveFilePicker(options);
	const destination = await handle.createWritable();
	await stream.pipeTo(destination);
}

export async function writeBlobToLocalFileSystem(
	blob: Blob,
	options?: SaveFilePickerOptions
) {
	const handle = await window.showSaveFilePicker(options);
	const destination = await handle.createWritable();
	await destination.write(blob);
	await destination.close();
}

interface Nameable {
	name: string;
}

/**
 * Returns the file extension of a given file. Everything after the last
 * period ('.') in the filename is considered part of the file extension.
 * The period itself is not part of the file extension. If the filename
 * contains no periods, an empty string is returned.
 *
 * @param file the file
 * @returns the file's file extension or an empty string
 */
export function fileExtension<T extends Nameable>(file: T): string {
	const split = file.name.split(".");

	if (split.length === 1) {
		return "";
	} else {
		return split.pop()!;
	}
}

/**
 * Checks if a given file has one of the specified file extensions.
 * The check is **case-insensitive**.
 *
 * @param file the file
 * @param extensions the expected file extensions *with or without* a period
 * @returns true if one file extension matched, false otherwise
 */
export function hasFileExtension<T extends Nameable>(
	file: T,
	extensions: string[]
) {
	for (let extension of extensions) {
		if (!extension.startsWith(".")) {
			extension = "." + extension;
		}
		if (file.name.toLowerCase().endsWith(extension.toLowerCase())) {
			return true;
		}
	}
	return false;
}

export function humanReadableDataSize(
	size: number,
	base: 2 | 10 = 2,
	fractionDigits = 2
): string {
	if (size === 0) {
		return "0 bytes";
	}

	let units: string[];
	let magnitude: number;
	let roundedSize: number;
	if (base === 2) {
		units = ["bytes", "KiB", "MiB", "GiB", "TiB"];
		magnitude = Math.floor(Math.log2(size) / 10);
		roundedSize = size / Math.pow(1024, magnitude);
	} else {
		units = ["bytes", "kB", "MB", "GB", "TB"];
		magnitude = Math.floor(Math.log10(size) / 3);
		roundedSize = size / Math.pow(1000, magnitude);
	}
	if (magnitude === 0) {
		fractionDigits = 0;
	}

	if (magnitude < units.length) {
		return `${roundedSize.toFixed(fractionDigits)} ${units[magnitude]}`;
	} else {
		console.error("Unsupported file size.");
		return "";
	}
}

export function fileName(rawFileName: string) {
	const lastDotPosition = rawFileName.lastIndexOf(".");
	if (lastDotPosition === -1) return rawFileName;
	return rawFileName.substring(0, lastDotPosition);
}
