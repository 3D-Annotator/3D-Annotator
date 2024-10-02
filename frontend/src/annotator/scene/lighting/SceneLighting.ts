import { type Light, type Object3D } from "three";
import { type SceneSubject } from "../SceneSubject";

export const DEFAULT_LIGHT_COLOR = 0xffffff;

/**
 * A SceneLighting
 */
export abstract class SceneLighting implements SceneSubject {
	/**
	 * Creates lighting for a scene.
	 *
	 * @returns an array of Lights
	 */
	protected abstract getLights(): Light[];

	/**
	 * Returns the array containing all lights.
	 *
	 * @returns the light array.
	 */
	public getObjects(): Object3D[] {
		return this.getLights();
	}

	/**
	 * Disposes all lights.
	 */
	public dispose(): void {
		for (const light of this.getLights()) {
			light.dispose();
		}
	}

	/**
	 * Updates the lighting.
	 * (does nothing because its currently not needed)
	 */
	public update(): void {
		// nothing to update
	}

	public abstract setLightIntensity(intensity: number): void;

	public abstract getLightIntensity(): number;
}
