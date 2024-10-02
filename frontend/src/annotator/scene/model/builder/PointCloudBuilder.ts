import {
	BufferAttribute,
	DynamicDrawUsage,
	MeshBasicMaterial,
	Points,
	PointsMaterial,
	Mesh as ThreeMesh,
	type BufferGeometry,
} from "three";
import { CENTER } from "three-mesh-bvh";
import { wait } from "~util/Timeout";
import { NonBlockingBVHBuilder } from "./bvh/NonBlockingBVHBuilder";

export const DEFAULT_POINT_SIZE = 0.005;
// Currently only gray scale supported
const DEFAULT_COLOR = 200;

/**
 * Builds a PointCloud model
 */
export class PointCloudBuilder {
	private readonly geometry: BufferGeometry;

	/**
	 * constructs a new PointCloudBuilder Instance.
	 *
	 * @param geometry a {@link THREE.BufferGeometry}
	 */
	constructor(geometry: BufferGeometry) {
		this.geometry = geometry;
	}

	/**
	 * Builds the {@link THREE.Mesh} out of the {@link THREE.BufferGeometry} which was defined in the constructor
	 *
	 * @returns an array which contains {@link THREE.Points} and {@link THREE.Mesh}
	 */
	public async build(): Promise<[Points, ThreeMesh]> {
		await wait();
		if (!this.geometry.hasAttribute("color")) {
			const colors = new Float32Array(
				this.geometry.attributes.position.count * 3
			);
			colors.fill(DEFAULT_COLOR / 255);
			const attribute = new BufferAttribute(colors, 3);
			this.geometry.setAttribute("color", attribute);
			await wait();
		}

		const colorAttribute = this.geometry.getAttribute(
			"color"
		) as BufferAttribute;
		colorAttribute.setUsage(DynamicDrawUsage);

		const params = {
			displayHelper: false,
			helperDepth: 10,
			displayParents: false,
			strategy: CENTER,
			pointSize: DEFAULT_POINT_SIZE,
			raycastThreshold: 0.005,
			useBVH: true,
		};

		await wait();
		this.geometry.center();

		await wait();
		const material = new PointsMaterial({
			size: params.pointSize,
			vertexColors: true,
		});

		const pointCloud = new Points(this.geometry, material);
		pointCloud.matrixAutoUpdate = false;

		await wait();
		const bvhMesh = await this.createBVHMesh();

		await wait();
		const bvhBuilder = new NonBlockingBVHBuilder();
		const bvh = await bvhBuilder.build(bvhMesh.geometry);
		bvhBuilder.dispose();
		bvhMesh.geometry.boundsTree = bvh;

		return Promise.resolve([pointCloud, bvhMesh]);
	}

	private async createBVHMesh() {
		const bvhGeometry = this.geometry.clone();
		await wait();

		const verticesLength = bvhGeometry.attributes.position.count;
		const indices = [];

		for (let i = 0; i < verticesLength; i++) {
			indices.push(i, i, i);
		}
		await wait();

		bvhGeometry.setIndex(indices);

		const bvhMaterial = new MeshBasicMaterial({
			color: 0xff0000,
		});
		const bvhMesh = new ThreeMesh(bvhGeometry, bvhMaterial);
		return bvhMesh;
	}
}
