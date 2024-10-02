import {
	CircleGeometry,
	MeshStandardMaterial,
	Mesh as ThreeMesh,
	type Object3D,
} from "three";
import type { SceneSubject } from "~annotator/scene/SceneSubject";

const DEFAULT_OPTIONS = {
	radius: 1,
	segments: 64,
	color: 0xec407a,
	transparent: true,
	opacity: 0.5,
	emissiveIntensity: 0.5,
};

export class Circle implements SceneSubject {
	public static readonly MIN_SCALE = 0;
	public static readonly DEFAULT_SCALE = 0.1;
	public static readonly MAX_SCALE = 2;

	private readonly geometry: CircleGeometry;
	private readonly material: MeshStandardMaterial;
	private readonly mesh: ThreeMesh;

	private scale = 0;

	constructor(options?: Partial<typeof DEFAULT_OPTIONS>) {
		const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

		this.geometry = new CircleGeometry(
			mergedOptions.radius,
			mergedOptions.segments
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
	 * Returns `true` if the circle is visible and `false` otherwise.
	 *
	 * @returns `true` if the circle is visible and `false` otherwise
	 */
	public isVisible(): boolean {
		return this.mesh.visible;
	}

	/**
	 * Makes the circle visible
	 */
	public setVisible() {
		this.mesh.visible = true;
	}

	/**
	 * Makes the circle invisible
	 */
	public setInvisible() {
		this.mesh.visible = false;
	}

	/**
	 * Changes the scale of the underlying {@link Object3D}.
	 *
	 * `scale` should be a human readable value.
	 * To manipulate this value, use `factor`
	 * (e.g. to translate the human readable value into the correct scalar).
	 *
	 * @param scale the scale between {@link MIN_SCALE} and {@link MAX_SCALE}
	 * @param factor the factor the scale will be multiplied with before applying the value
	 */
	public setScale(scale: number, factor: number) {
		if (scale < Circle.MIN_SCALE) {
			this.scale = Circle.MIN_SCALE * factor;
		} else if (scale > Circle.MAX_SCALE) {
			this.scale = Circle.MAX_SCALE * factor;
		} else {
			this.scale = scale * factor;
		}

		this.mesh.scale.setScalar(this.scale);
	}

	public setPosition(x: number, y: number, z: number) {
		this.mesh.position.set(x, y, z);
	}

	public getObjects(): Object3D[] {
		return [this.mesh];
	}

	public update(): void {
		// nothing to update
	}

	public dispose(): void {
		this.geometry.dispose();
		this.material.dispose();
	}
}
