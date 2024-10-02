import {
	BufferAttribute,
	MeshPhongMaterial,
	Mesh as ThreeMesh,
	type BufferGeometry,
	type Material,
	type Texture,
} from "three";
import { wait } from "~util/Timeout";
import { NonBlockingBVHBuilder } from "./bvh/NonBlockingBVHBuilder";

const DEFAULT_MATERIAL_COLOR = "#CCCCCC";

/**
 * Builds a Mesh model
 */
export class MeshBuilder {
	private readonly geometry: BufferGeometry;
	private readonly texture?: Texture;

	/**
	 * constructs a new MeshBuilder Instance.
	 *
	 * @param geometry a {@link THREE.BufferGeometry}
	 * @param texture a optional {@link THREE.Texture}
	 */
	constructor(geometry: BufferGeometry, texture?: Texture) {
		this.texture = texture;
		this.geometry = geometry;
	}

	/**
	 * Builds the {@link THREE.Mesh} out of the {@link THREE.BufferGeometry} and the optional {@link THREE.Texture} which were defined in the constructor.
	 *
	 * If the mesh has a texture and a color attribute, the color attribute will be ignored.
	 *
	 * If the mesh has a color attribute with an item size other than 3, the color attribute will be ignored.
	 *
	 * If the mesh has no color attribute or if the color attribute was ignored, a new color attribute with an item size of 4 will be created.
	 *
	 * @returns the build Mesh
	 */
	public async build(): Promise<ThreeMesh> {
		await wait();
		const geometry = this.geometry;

		if (this.texture && this.geometry.hasAttribute("color")) {
			console.warn(
				"Mesh has a texture and color values. Color values will be ignored..."
			);
			this.geometry.deleteAttribute("color");
		}

		if (
			this.geometry.hasAttribute("color") &&
			this.geometry.getAttribute("color").itemSize !== 3
		) {
			console.warn(
				`Mesh color attribute has an unsupported item size (${
					this.geometry.getAttribute("color").itemSize
				}). Color values will be ignored...`
			);
			this.geometry.deleteAttribute("color");
		}

		await wait();
		let material: Material;
		if (this.texture) {
			material = new MeshPhongMaterial({ map: this.texture });
		} else {
			material = new MeshPhongMaterial({
				color: DEFAULT_MATERIAL_COLOR,
			});
		}
		material.vertexColors = false;
		material.transparent = false;

		const vertexMaterial = new MeshPhongMaterial();
		vertexMaterial.vertexColors = true;
		vertexMaterial.transparent = true;

		const count = geometry.attributes.position.count;

		await wait();
		let colorAttribute: BufferAttribute;
		if (!this.geometry.hasAttribute("color")) {
			const colors = new Float32Array(count * 4);
			colorAttribute = new BufferAttribute(colors, 4);
			geometry.setAttribute("color", colorAttribute);
		}

		await wait();
		const bvhBuilder = new NonBlockingBVHBuilder();
		const bvh = await bvhBuilder.build(geometry);
		bvhBuilder.dispose();
		geometry.boundsTree = bvh;

		await wait();
		const mesh = new ThreeMesh(geometry, [material, vertexMaterial]);

		mesh.geometry.addGroup(0, Infinity, 0);
		mesh.geometry.addGroup(0, Infinity, 1);
		return Promise.resolve(mesh);
	}
}
