import { err, ok, type Result } from "neverthrow";
import {
	type Object3D,
	type Points,
	type PointsMaterial,
	type Mesh as ThreeMesh,
} from "three";
import { type Observer } from "~entity/Types";
import { PointCloudBuilder } from "./builder/PointCloudBuilder";
import { GenericLoader } from "./loader/GenericLoader";
import { type LoaderError } from "./loader/Loader";
import { disposeMaterials, type GeometryObject3D, type Model } from "./Model";

/**
 * A PointCloud Model
 */
export class PointCloud implements Model {
	private readonly loader = new GenericLoader();

	// initialized in this.initializeModel()
	private points?: Points;
	private bvhMesh?: ThreeMesh;

	public getBVHMesh(): ThreeMesh {
		if (!this.bvhMesh) {
			throw new Error(
				"Please use the initializeModel method before accessing this field."
			);
		}

		return this.bvhMesh;
	}

	public getPoints(): Points {
		if (!this.points) {
			throw new Error(
				"Please use the initializeModel method before accessing this field."
			);
		}

		return this.points;
	}

	public getObject(): GeometryObject3D {
		return this.getPoints();
	}

	public setPointSize(size: number) {
		if (!this.points) {
			throw new Error(
				"Please use the initializeModel method before accessing this field."
			);
		}

		const material = this.points.material as PointsMaterial;
		material.size = size;
	}

	public async initializeModel(
		files: File[],
		onProgress?: Observer<number>
	): Promise<Result<undefined, LoaderError>> {
		if (files.length !== 1) {
			throw new Error("expected one file but got " + files.length);
		}

		const res = await this.loader.load(files, onProgress);
		if (res.isErr()) {
			return err(res.error);
		}

		const { geometry } = res.value;
		const builder = new PointCloudBuilder(geometry);
		const [pointCloud, bvhMesh] = await builder.build();
		this.bvhMesh = bvhMesh;
		this.points = pointCloud;
		return ok(undefined);
	}

	/**
	 * Returns index count of vertices in the point cloud
	 *
	 * @returns index count
	 */
	public getIndexCount(): number {
		const positionAttr = this.getPoints().geometry.getAttribute("position");
		return positionAttr.count;
	}

	/**
	 * Translates the bvh vertex indices to point cloud vertex indices
	 *
	 * @param indices the bvh indices
	 * @returns the translated point cloud indices
	 */
	public translateBVHIndices(indices: number[]): number[] {
		const indexAttr = this.getBVHMesh().geometry.index!;
		const translatedIndices = new Array<number>(indices.length);
		for (let i = 0; i < indices.length; i++) {
			translatedIndices[i] = indexAttr.getX(indices[i]);
		}
		return translatedIndices;
	}

	public getObjects(): Object3D[] {
		return [this.getPoints()];
	}

	/**
	 * Updates the point cloud
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
		this.points?.geometry.dispose();
		disposeMaterials(this.points?.material);

		this.bvhMesh?.geometry.dispose();
		this.bvhMesh?.geometry.disposeBoundsTree();
		disposeMaterials(this.bvhMesh?.material);
	}
}
