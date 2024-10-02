import { type Perspective } from "~entity/Perspective";
import { type Disposable, type Updatable } from "~entity/Types";
import type { Camera, CameraType } from "../Camera";

export interface CameraControls extends Updatable, Disposable {
	getCamera(): Camera;
	setCamera(type: CameraType): void;
	setFOV(fov: number): void;
	/**
	 * Sets the camera to a new {@link Perspective}
	 *
	 * @param perspective the {@link Perspective}
	 */
	setCameraPerspective(perspective: Perspective): void;

	/**
	 * Returns the distance of the camera to the target after a
	 * camera perspective has been set.
	 */
	getPerspectiveDistance(): number;
	enable(): void;
	disable(): void;
	resetControls(): void;
	show(show: boolean): void;
}
