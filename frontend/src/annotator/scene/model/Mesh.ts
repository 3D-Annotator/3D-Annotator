import { err, ok, type Result } from "neverthrow";
import { type Object3D, type Texture, type Mesh as ThreeMesh } from "three";
import { type Observer } from "~entity/Types";
import { MeshBuilder } from "./builder/MeshBuilder";
import { GenericLoader } from "./loader/GenericLoader";
import { type LoaderError } from "./loader/Loader";
import { disposeMaterials, type GeometryObject3D, type Model } from "./Model";

/**
 * A Mesh Model
 */
export class Mesh implements Model {
	private readonly loader = new GenericLoader();

	// initialized in this.initializeModel()
	private texture?: Texture;
	private mesh?: ThreeMesh;

	/**
	 * Returns the {@link THREE.Mesh}
	 *
	 * @returns a {@link THREE.Mesh}
	 */
	public getMesh(): ThreeMesh {
		if (!this.mesh) {
			throw new Error(
				"Please use the initializeModel method before accessing this field."
			);
		}

		return this.mesh;
	}

	public getObject(): GeometryObject3D {
		return this.getMesh();
	}

	public async initializeModel(
		files: File[],
		onProgress?: Observer<number>
	): Promise<Result<undefined, LoaderError>> {
		const res = await this.loader.load(files, onProgress);
		if (res.isErr()) {
			return err(res.error);
		}
		const { geometry, texture } = res.value;
		this.texture = texture;
		const builder = new MeshBuilder(geometry, texture);
		this.mesh = await builder.build();
		return ok(undefined);
	}

	/**
	 * Returns index count of faces in the mesh
	 *
	 * @returns index count
	 */
	public getIndexCount(): number {
		const positionAttr = this.getMesh().geometry.getAttribute("position");
		return positionAttr.count / 3;
	}

	/**
	 * Translates the bvh face indices to mesh face indices
	 *
	 * @param indices the bvh indices
	 * @returns the translated mesh indices
	 */
	public translateBVHIndices(indices: number[]): number[] {
		const indexAttr = this.getMesh().geometry.index!;
		const translatedIndices = new Array<number>(indices.length);
		for (let i = 0; i < indices.length; i++) {
			translatedIndices[i] = indexAttr.getX(indices[i] * 3) / 3;
		}
		return translatedIndices;
	}

	public getObjects(): Object3D[] {
		return [this.getMesh()];
	}

	/**
	 * Updates the mesh
	 */
	public update(): void {
		// nothing to do
	}

	/**
	 * Disposes:
	 * 	- the mesh geometry
	 *  - the mesh bounds tree
	 *  - the mesh material
	 *  - the mesh texture
	 */
	public dispose(): void {
		this.mesh?.geometry.dispose();
		this.mesh?.geometry.disposeBoundsTree();
		disposeMaterials(this.mesh?.material);
		this.texture?.dispose();
	}
}
