import {
	MeshStandardMaterial,
	SphereGeometry,
	Mesh as ThreeMesh,
	Sphere as ThreeSphere,
	type Object3D,
	type Vector3,
} from "three";
import { type SceneSubject } from "~annotator/scene/SceneSubject";

const DEFAULT_OPTIONS = {
	radius: 1,
	widthSegments: 32,
	heightSegments: 16,
	color: 0xec407a,
	transparent: true,
	opacity: 0.5,
	emissiveIntensity: 0.5,
};

/**
 * A Sphere used by tools to visualize the brush position and size
 */
export class Sphere implements SceneSubject {
	public static readonly MIN_SCALE = 0;
	public static readonly DEFAULT_SCALE = 0.01;
	public static readonly MAX_SIZE = 3;

	private readonly geometry: SphereGeometry;
	private readonly material: MeshStandardMaterial;
	private readonly mesh: ThreeMesh;

	private radius: number;
	private scale = 0;

	/**
	 * Constructs an new instance of the Sphere
	 *
	 * @param options optional default options
	 */
	constructor(options?: Partial<typeof DEFAULT_OPTIONS>) {
		const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
		this.radius = mergedOptions.radius;

		this.geometry = new SphereGeometry(
			mergedOptions.radius,
			mergedOptions.widthSegments,
			mergedOptions.heightSegments
		);
		this.material = new MeshStandardMaterial({
			color: mergedOptions.color,
			transparent: mergedOptions.transparent,
			opacity: mergedOptions.opacity,
			premultipliedAlpha: true,
			emissive: mergedOptions.color,
			emissiveIntensity: mergedOptions.emissiveIntensity,
		});

		this.mesh = new ThreeMesh(this.geometry, this.material);
		this.setInvisible();
	}

	/**
	 * Sets the size of the sphere
	 *
	 * @param size the size
	 */
	public setScale(size: number, factor: number) {
		if (size < Sphere.MIN_SCALE) {
			this.scale = Sphere.MIN_SCALE * factor;
		} else if (size > Sphere.MAX_SIZE) {
			this.scale = Sphere.MAX_SIZE * factor;
		} else {
			this.scale = size * factor;
		}

		this.mesh.scale.setScalar(this.scale);
	}

	/**
	 * Returns the radius of the sphere
	 *
	 * @returns the radius
	 */
	public getEffectiveRadius(): number {
		return this.radius * this.scale;
	}

	/**
	 * Returns `true` if the sphere is visible and `false` otherwise.
	 *
	 * @returns `true` if the sphere is visible and `false` otherwise
	 */
	public isVisible(): boolean {
		return this.mesh.visible;
	}

	/**
	 * Makes the sphere visible
	 */
	public setVisible() {
		this.mesh.visible = true;
	}

	/**
	 * Makes the sphere invisible
	 */
	public setInvisible() {
		this.mesh.visible = false;
	}

	/**
	 * Returns the sphere position
	 *
	 * @returns the position
	 */
	public getPosition(): Vector3 {
		return this.mesh.position;
	}

	/**
	 * Sets the sphere position
	 * @param position the position
	 */
	public setPosition(position: Vector3) {
		this.mesh.position.copy(position);
	}

	/**
	 * Creates a new sphere with the same position and radius as this sphere
	 *
	 * @returns a sphere
	 */
	public createThreeSphere(): ThreeSphere {
		const sphere = new ThreeSphere();
		sphere.center.copy(this.mesh.position);
		sphere.radius = this.getEffectiveRadius();
		return sphere;
	}

	public getObjects(): Object3D[] {
		return [this.mesh];
	}

	/**
	 * Updates this sphere
	 * (currently not implemented)
	 */
	public update(): void {
		// noting to update
	}

	/**
	 * Disposes this sphere
	 */
	public dispose(): void {
		this.geometry.dispose();
		this.material.dispose();
	}
}
