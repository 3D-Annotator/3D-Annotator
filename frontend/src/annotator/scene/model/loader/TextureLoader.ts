import { ok } from "neverthrow";
import {
	SRGBColorSpace,
	TextureLoader as ThreeTextureLoader,
	type Texture,
} from "three";
import { type Observer } from "~entity/Types";
import { hasFileExtension } from "~util/FileUtils";
import { type Loader } from "./Loader";

export const TEXTURE_FILE_EXTENSIONS = ["jpg", "jpeg", "png"];

/**
 * A TextureLoader to load models out of texture files
 */
export class TextureLoader implements Loader<Texture> {
	private readonly loader = new ThreeTextureLoader();

	public async load(textureFile: File, onProgress?: Observer<number>) {
		if (onProgress) {
			throw new Error("onProgress callback is currently not supported");
		}

		if (!hasFileExtension(textureFile, TEXTURE_FILE_EXTENSIONS)) {
			throw new Error(
				`Expected an image file but got '${textureFile.name}'.`
			);
		}

		const textureURL = URL.createObjectURL(textureFile);

		let texture: Texture;
		try {
			texture = await this.loader.loadAsync(
				textureURL
				// progress currently not supported by ThreeTextureLoader
			);
			texture.colorSpace = SRGBColorSpace;
		} catch (err) {
			return Promise.reject(err);
		} finally {
			URL.revokeObjectURL(textureURL);
		}

		console.log("texture: ", texture);
		return Promise.resolve(ok(texture));
	}
}
