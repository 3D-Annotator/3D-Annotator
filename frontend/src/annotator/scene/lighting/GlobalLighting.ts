import { AmbientLight, DirectionalLight, type Light } from "three";
import { DEFAULT_LIGHT_COLOR, SceneLighting } from "./SceneLighting";

export const DEFAULT_GLOBAL_LIGHT_INTENSITY = 1;

/**
 * A simple SceneLighting
 */
export class GlobalLighting extends SceneLighting {
	private intensity = DEFAULT_GLOBAL_LIGHT_INTENSITY;
	private ambientLight: AmbientLight;
	private directionalLights: DirectionalLight[];

	constructor() {
		super();
		this.ambientLight = new AmbientLight(
			DEFAULT_LIGHT_COLOR,
			this.intensity
		);
		const light1 = new DirectionalLight(
			DEFAULT_LIGHT_COLOR,
			this.intensity
		);
		light1.position.set(1, 0, 0);
		const light2 = new DirectionalLight(
			DEFAULT_LIGHT_COLOR,
			this.intensity
		);
		light2.position.set(-1, 0, 0);
		const light3 = new DirectionalLight(
			DEFAULT_LIGHT_COLOR,
			this.intensity
		);
		light3.position.set(0, 1, 0);
		const light4 = new DirectionalLight(
			DEFAULT_LIGHT_COLOR,
			this.intensity
		);
		light4.position.set(0, -1, 0);
		const light5 = new DirectionalLight(
			DEFAULT_LIGHT_COLOR,
			this.intensity
		);
		light5.position.set(0, 0, 1);
		const light6 = new DirectionalLight(
			DEFAULT_LIGHT_COLOR,
			this.intensity
		);
		light6.position.set(0, 0, -1);

		this.directionalLights = [
			light1,
			light2,
			light3,
			light4,
			light5,
			light6,
		];
	}

	/**
	 * Ambient light and a Directional light shining from the top to the center
	 *
	 * @returns an array of Lights
	 */
	protected getLights(): Light[] {
		return [this.ambientLight, ...this.directionalLights];
	}

	public override setLightIntensity(intensity: number): void {
		this.intensity = intensity;

		for (const light of this.directionalLights) {
			light.intensity = intensity;
		}
		this.ambientLight.intensity = intensity;
	}

	public override getLightIntensity(): number {
		return this.intensity;
	}
}
