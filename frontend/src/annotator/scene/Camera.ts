import {
	MathUtils as ThreeMathUtils,
	type OrthographicCamera as ThreeOrthographicCamera,
	type PerspectiveCamera as ThreePerspectiveCamera,
} from "three";
import { assertUnreachable } from "~util/TypeScript";

export interface OrthographicCamera extends ThreeOrthographicCamera {
	type: "OrthographicCamera";
	isPerspectiveCamera: undefined;
}

export interface PerspectiveCamera extends ThreePerspectiveCamera {
	type: "PerspectiveCamera";
	isOrthographicCamera: undefined;
}

export type Camera = OrthographicCamera | PerspectiveCamera;

export type CameraType = OrthographicCamera["type"] | PerspectiveCamera["type"];

/**
 * Returns the height of the camera image at the given distance in world space.
 *
 * Ignores the camera's zoom for perspective cameras.
 *
 * As per definition, the distance is ignored for orthographic cameras.
 *
 * @param camera the camera
 * @param distance the distance from the camera
 * @returns the height
 */
export function getHeightAt(camera: Camera, distance: number): number {
	if (camera.isOrthographicCamera) {
		return Math.abs(camera.bottom - camera.top) / 2 / camera.zoom;
	} else if (camera.isPerspectiveCamera) {
		return Math.tan((ThreeMathUtils.DEG2RAD * camera.fov) / 2) * distance;
	}
	assertUnreachable(camera);
}

/**
 * Returns the width of the camera image at the given distance
 * in world space.
 *
 * Ignores the camera's zoom for perspective cameras.
 *
 * As per definition, the distance is ignored for orthographic cameras.
 *
 * @param camera the camera
 * @param distance the distance from the camera
 * @returns the width
 */
export function getWidthAt(camera: Camera, distance: number): number {
	if (camera.isOrthographicCamera) {
		return Math.abs(camera.right - camera.left) / 2 / camera.zoom;
	} else if (camera.isPerspectiveCamera) {
		return getHeightAt(camera, distance) * camera.aspect;
	}
	assertUnreachable(camera);
}
