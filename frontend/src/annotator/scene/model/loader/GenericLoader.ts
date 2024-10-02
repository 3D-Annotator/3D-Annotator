import { err, ok, type Result } from "neverthrow";
import { type BufferGeometry, type Texture } from "three";
import { type Observer } from "~entity/Types";
import { hasFileExtension } from "~util/FileUtils";
import {
	type Loader,
	type LoaderError,
	type ModelLoaderWorker,
} from "./Loader";
import {
	NonBlockingOBJLoader,
	OBJ_FILE_EXTENSIONS,
} from "./obj/NonBlockingOBJLoader";
import {
	NonBlockingPLYLoader,
	PLY_FILE_EXTENSIONS,
} from "./ply/NonBlockingPLYLoader";
import { TEXTURE_FILE_EXTENSIONS, TextureLoader } from "./TextureLoader";

interface GenericLoaderResult {
	geometry: BufferGeometry;
	texture?: Texture;
}

/**
 * A Generic loader to load models from model files
 */
export class GenericLoader implements Loader<GenericLoaderResult, File[]> {
	/**
	 *
	 * **Important note**:\
	 * The onProgress callback currently only tracks the progress of loading
	 * the model file.\
	 * Tracking the progress of the following tasks is **not** (yet) supported:
	 * - loading the texture file
	 * - parsing/reading the model and texture file
	 *
	 * @param files model files
	 * @param onProgress an optional onProgress {@link Observer}
	 * @return a {@link GenericLoaderResult}
	 */
	public async load(
		files: File[],
		onProgress?: Observer<number>
	): Promise<Result<GenericLoaderResult, LoaderError>> {
		if (files.length === 0) {
			throw new Error("expected at least one file");
		}

		if (files.length > 2) {
			throw new Error("Not more than two files supported.");
		}

		let modelLoader: ModelLoaderWorker | undefined;
		let modelFile: File | undefined;

		let textureLoader: TextureLoader | undefined;
		let textureFile: File | undefined;

		for (const file of files) {
			if (!modelLoader && hasFileExtension(file, OBJ_FILE_EXTENSIONS)) {
				modelLoader = new NonBlockingOBJLoader();
				modelFile = file;
			} else if (
				!modelLoader &&
				hasFileExtension(file, PLY_FILE_EXTENSIONS)
			) {
				modelLoader = new NonBlockingPLYLoader();
				modelFile = file;
			} else if (
				!textureLoader &&
				hasFileExtension(file, TEXTURE_FILE_EXTENSIONS)
			) {
				textureLoader = new TextureLoader();
				textureFile = file;
			} else {
				throw new Error(`unable to select loader for '${file.name}'`);
			}
		}

		if (!modelLoader || !modelFile) {
			throw new Error(`unable to select a model loader`);
		}

		if (textureLoader && textureFile) {
			const [geometryRes, textureRes] = await Promise.all([
				modelLoader.load(modelFile, onProgress),
				textureLoader.load(textureFile),
			]);
			modelLoader.dispose();

			if (geometryRes.isErr()) {
				return err(geometryRes.error);
			}

			return ok({
				geometry: geometryRes.value,
				texture: textureRes.value,
			});
		} else {
			const geometryRes = await modelLoader.load(modelFile, onProgress);

			if (geometryRes.isErr()) {
				return err(geometryRes.error);
			}

			modelLoader.dispose();
			return ok({ geometry: geometryRes.value });
		}
	}
}
