import { DirectionalLight, Vector3, type Light } from "three";
import { Perspective } from "~entity/Perspective";
import type { Scene } from "../Scene";
import type { Model } from "../model/Model";
import { DEFAULT_LIGHT_COLOR, SceneLighting } from "./SceneLighting";

export const DEFAULT_SUN_LIGHT_INTENSITY = 1;
const DEFAULT_SUN_POSITION = new Vector3(0, 0, 1);

export class SunLighting extends SceneLighting {
	private intensity = DEFAULT_SUN_LIGHT_INTENSITY;
	private sunLight: DirectionalLight;
	private isActive = true;
	private scene: Scene<Model>;
	private useCustomSunPosition = false;
	private followCamera = false;

	constructor(scene: Scene<Model>) {
		super();

		this.sunLight = new DirectionalLight(
			DEFAULT_LIGHT_COLOR,
			this.isActive ? DEFAULT_SUN_LIGHT_INTENSITY : 0
		);
		this.sunLight.position.set(
			DEFAULT_SUN_POSITION.x,
			DEFAULT_SUN_POSITION.y,
			DEFAULT_SUN_POSITION.z
		);
		this.scene = scene;
	}

	protected override getLights(): Light[] {
		return [this.sunLight];
	}

	public override setLightIntensity(intensity: number): void {
		this.intensity = intensity;
		if (this.isActive) {
			this.sunLight.intensity = intensity;
		}
	}

	public override getLightIntensity(): number {
		return this.intensity;
	}

	public setIsActive(isActive: boolean): void {
		this.isActive = isActive;
		if (isActive) {
			this.sunLight.intensity = this.intensity;
		} else {
			this.sunLight.intensity = 0;
		}
	}

	public isSun(): boolean {
		return this.isActive;
	}

	public setSunPosition(position: Perspective) {
		this.useCustomSunPosition = false;

		switch (position) {
			case Perspective.TOP:
				this.sunLight.position.set(0, 0, 1);
				break;
			case Perspective.BOTTOM:
				this.sunLight.position.set(0, 0, -1);
				break;
			case Perspective.FRONT:
				this.sunLight.position.set(0, 1, 0);
				break;
			case Perspective.BACK:
				this.sunLight.position.set(0, -1, 0);
				break;
			case Perspective.LEFT:
				this.sunLight.position.set(1, 0, 0);
				break;
			case Perspective.RIGHT:
				this.sunLight.position.set(-1, 0, 0);
				break;
		}
	}

	public setSunToCameraPosition(): void {
		const cameraDirection = new Vector3();
		this.scene.camera.getWorldDirection(cameraDirection);
		this.sunLight.position.set(
			-cameraDirection.x,
			-cameraDirection.y,
			-cameraDirection.z
		);
		this.useCustomSunPosition = true;
	}

	public setFollowCamera(follow: boolean) {
		if (this.useCustomSunPosition) {
			this.followCamera = follow;
		}
	}

	public override update(): void {
		if (this.followCamera && this.isActive && this.useCustomSunPosition) {
			this.setSunToCameraPosition();
		}
	}
}
