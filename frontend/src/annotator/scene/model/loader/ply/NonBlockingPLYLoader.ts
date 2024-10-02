import { err, ok, type Result } from "neverthrow";
import { type BufferGeometry } from "three";
import { type Observer } from "~entity/Types";
import { hasFileExtension, humanReadableDataSize } from "~util/FileUtils";
import { createGeometryFromClone } from "~util/Three";
import { progressInPercent } from "~util/Util";
import {
	MAX_UTF8_FILE_LENGTH,
	PLY_BINARY_SIZE_WARNING,
	type LoaderError,
	type LoaderWorkerReceive,
	type LoaderWorkerSend,
	type ModelLoaderWorker,
} from "../Loader";

export const PLY_FILE_EXTENSIONS = ["ply"];

/**
 * A ModelLoader to load models in a webworker asynchronously out of .ply files
 */
export class NonBlockingPLYLoader implements ModelLoaderWorker {
	private running: boolean;
	private worker: Worker | null;

	constructor() {
		this.running = false;
		this.worker = new Worker(
			new URL("./PLYLoader.worker.ts", import.meta.url),
			{ type: "module" }
		);
		this.worker.onerror = (e) => {
			throw new Error(
				`PLYLoaderWorker: Could not create Web Worker: "${e.message}"`
			);
		};
	}

	public async load(
		modelFile: File,
		onProgress?: Observer<number>
	): Promise<Result<BufferGeometry, LoaderError>> {
		if (this.running) {
			throw new Error("PLYLoaderWorker: Already running job.");
		}

		if (this.worker === null) {
			throw new Error("PLYLoaderWorker: Worker has been disposed.");
		}

		if (!hasFileExtension(modelFile, PLY_FILE_EXTENSIONS)) {
			throw new Error(
				`Expected an ply file but got '${modelFile.name}'.`
			);
		}

		const size = humanReadableDataSize(modelFile.size);
		if (modelFile.size > PLY_BINARY_SIZE_WARNING) {
			console.warn(
				`PLYLoader: Parsing large binary encoded ply files may lead to browser errors! (File size: ${size})`
			);
		}

		if (modelFile.size > MAX_UTF8_FILE_LENGTH) {
			const maxSize = humanReadableDataSize(MAX_UTF8_FILE_LENGTH);
			console.warn(
				`PLYLoader: Parsing an ASCII encoded ply file larger than ${maxSize} is not supported! (File size: ${size})`
			);
		}

		const worker = this.worker;
		this.running = true;

		return new Promise((resolve, reject) => {
			worker.onerror = (e) => {
				reject(new Error(`PLYLoaderWorker: ${e.message}`));
				this.running = false;
			};

			worker.onmessage = ({ data }: MessageEvent<LoaderWorkerSend>) => {
				this.running = false;

				const { error, geometryClone, progress } = data;

				if (data.error) {
					reject(error);
					worker.onmessage = null;
				} else if (geometryClone) {
					const geometry = createGeometryFromClone(geometryClone);

					if (geometry.getAttribute("position").count === 0) {
						resolve(err({ code: "UNSUPPORTED_FILE_SIZE" }));
					} else {
						resolve(ok(geometry));
					}

					worker.onmessage = null;
				} else if (onProgress && progress) {
					onProgress(progressInPercent({ ...progress }));
				}
			};

			worker.postMessage<LoaderWorkerReceive>({
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
