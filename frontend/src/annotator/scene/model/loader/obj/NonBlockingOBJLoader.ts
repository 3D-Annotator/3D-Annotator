import { ok, type Result } from "neverthrow";
import { type BufferGeometry } from "three";
import { type Observer } from "~entity/Types";
import { hasFileExtension } from "~util/FileUtils";
import { createGeometryFromClone } from "~util/Three";
import { type ExcludeMethods } from "~util/TypeScript";
import { progressInPercent } from "~util/Util";
import { type LoaderError, type ModelLoaderWorker } from "../Loader";

export const OBJ_FILE_EXTENSIONS = ["obj"];

/**
 * The message the obj loader worker receives in order to start loading the file.
 */
export interface OBJLoaderWorkerReceive {
	modelFile: File;
	options: {
		hasProgressObserver: boolean;
	};
}

/**
 * The message the obj loader worker posts after loading has finished.
 */
export interface OBJLoaderWorkerSend {
	// the worker posts a structured clone of the BufferGeometry
	geometryClone?: ExcludeMethods<BufferGeometry>;
	error?: unknown;
	progress?: { loaded: number; total: number };
}

/**
 * Loads and parses obj files using a web worker.
 */
export class NonBlockingOBJLoader implements ModelLoaderWorker {
	private running: boolean;
	private worker: Worker | null;

	constructor() {
		this.running = false;
		this.worker = new Worker(
			new URL("./OBJLoader.worker.ts", import.meta.url),
			{ type: "module" }
		);
		this.worker.onerror = (error) => {
			throw new Error(
				`OBJLoaderWorker: Could not create Web Worker: "${error.message}"`
			);
		};
	}

	public async load(
		modelFile: File,
		onProgress?: Observer<number>
	): Promise<Result<BufferGeometry, LoaderError>> {
		if (this.running) {
			throw new Error("OBJLoaderWorker: Already running job.");
		}

		if (this.worker === null) {
			throw new Error("OBJLoaderWorker: Worker has been disposed.");
		}

		if (!hasFileExtension(modelFile, OBJ_FILE_EXTENSIONS)) {
			throw new Error(
				`Expected an obj file but got '${modelFile.name}'.`
			);
		}

		const worker = this.worker;
		this.running = true;

		return new Promise((resolve, reject) => {
			worker.onerror = (e) => {
				reject(new Error(`OBJLoaderWorker: ${e.message}`));
				this.running = false;
			};

			worker.onmessage = ({
				data,
			}: MessageEvent<OBJLoaderWorkerSend>) => {
				this.running = false;
				const { error, geometryClone, progress } = data;

				if (error) {
					reject(error);
					worker.onmessage = null;
				} else if (geometryClone) {
					const geometry = createGeometryFromClone(geometryClone);
					resolve(ok(geometry));
					worker.onmessage = null;
				} else if (onProgress !== undefined && progress) {
					onProgress(progressInPercent(progress));
				}
			};

			worker.postMessage<OBJLoaderWorkerReceive>({
				modelFile: modelFile,
				options: {
					hasProgressObserver: Boolean(onProgress),
				},
			});
		});
	}

	public dispose() {
		if (this.worker === null) return;
		this.worker.terminate();
		this.worker = null;
	}
}
