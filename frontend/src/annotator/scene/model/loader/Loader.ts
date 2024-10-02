import { type Result } from "neverthrow";
import { type BufferGeometry } from "three";
import { type Disposable, type Observer } from "~entity/Types";
import { type ExcludeMethods } from "~util/TypeScript";

/**
 * UTF-8 encoded files may not be larger than this. Otherwise they cannot be
 * parsed by the three.js FileLoader. Workarounds are possible and documented
 * in the appropriate loader.
 * This is the max length of a string in Google Chrome (tested on Chrome 111).
 * This has not changed since Chrome 62 (V8 6.2.100) when the max size was changed
 * from ~256 MiB to ~1 GiB. This results in the max length of ~1024^3/2, as in js
 * strings are UTF-16 encoded. For UTF-8 encoded files the max file length, for the
 * file to be represented in a single string, is exactly MAX_STRING_LENGTH bytes.
 */
export const MAX_UTF8_FILE_LENGTH = 536_870_888;

/**
 * If binary encoded ply files are bigger than ~360MB some browsers may fault
 * while parsing.
 */
export const PLY_BINARY_SIZE_WARNING = 360 * Math.pow(2, 20);

export interface LoaderError {
	code: "UNSUPPORTED_FILE_SIZE";
}

/**
 * A loader to load models from model files
 */
export interface Loader<R, F extends File | File[] = File> {
	load(
		file: F,
		onProgress?: Observer<number>
	): Promise<Result<R, LoaderError>>;
}

export type ModelLoader = Loader<BufferGeometry>;

export interface ModelLoaderWorker extends Loader<BufferGeometry>, Disposable {}

/**
 * The message a loader worker receives in order to start loading the file.
 */
export interface LoaderWorkerReceive {
	modelFile: File;
	options: {
		hasProgressObserver: boolean;
	};
}

/**
 * The message a loader worker posts after loading has finished.
 */
export interface LoaderWorkerSend {
	// the worker posts a structured clone of the BufferGeometry
	geometryClone?: ExcludeMethods<BufferGeometry>;
	error?: unknown;
	progress?: { loaded: number; total: number };
}
