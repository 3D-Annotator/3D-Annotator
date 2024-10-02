import { type Result } from "neverthrow";
import { type BufferGeometry, type Material, type Object3D } from "three";
import { type Observer } from "~entity/Types";
import { type SceneSubject } from "../SceneSubject";
import { type LoaderError } from "./loader/Loader";

export interface GeometryObject3D extends Object3D {
	geometry: BufferGeometry;
	material: Material | Material[];
}

/**
 * A 3D-Model
 */
export interface Model extends SceneSubject {
	/**
	 *Initializes a model
	 *
	 * @param files the model files
	 * @param onProgress an optional {@link Observer} which tracks progress
	 */
	initializeModel(
		files: File[],
		onProgress?: Observer<number>
	): Promise<Result<undefined, LoaderError>>;
	getIndexCount(): number;
	translateBVHIndices(indices: number[]): number[];
	getObject(): GeometryObject3D;
}

/**
 * Disposes all given materials.
 *
 * @param materials the materials to dispose.
 */
export function disposeMaterials(materials: Material | Material[] | undefined) {
	if (!materials) {
		return;
	}

	if (!Array.isArray(materials)) {
		materials.dispose();
		return;
	}

	for (const material of materials) {
		material.dispose();
	}
}
