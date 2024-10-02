import {
	Vector3,
	type Box3,
	type OrthographicCamera,
	type PerspectiveCamera,
	type Renderer,
	type Scene as ThreeScene,
} from "three";
import { ArcballControls } from "three/examples/jsm/controls/ArcballControls";
import { Perspective } from "~entity/Perspective";
import { assertUnreachable } from "~util/TypeScript";
import { type Camera, type CameraType } from "../Camera";
import { type Scene } from "../Scene";
import { type Model } from "../model/Model";
import { type CameraControls } from "./CameraControls";

enum ArcballControlsMouseActionOperations {
	PAN = "PAN",
	ROTATE = "ROTATE",
	ZOOM = "ZOOM",
	FOV = "FOV",
}

enum ArcballControlsMouseActionKeys {
	SHIFT = "SHIFT",
	CTRL = "CTRL",
}

/**
 * Basic camera controls
 * Used to change Camera properties
 */
export class ArcballCameraControls implements CameraControls {
	private readonly scene: Scene<Model>;
	private readonly controls: ArcballControls & { target: Vector3 };

	private readonly orthographicCamera: OrthographicCamera;
	private readonly perspectiveCamera: PerspectiveCamera;
	private fov: number;
	private currentCamera: Camera;

	private boundingBox: Box3;
	private boundingBoxMaxDimension: number;
	private distance = 0;
	private zoom = 0;

	/**
	 * Constructs new CameraControls
	 *
	 * @param camera a camera
	 * @param renderer a renderer
	 */
	constructor(
		scene: Scene<Model>,
		orthographicCamera: OrthographicCamera,
		perspectiveCamera: PerspectiveCamera,
		renderer: Renderer,
		threeScene: ThreeScene
	) {
		this.scene = scene;
		this.orthographicCamera = orthographicCamera;
		this.perspectiveCamera = perspectiveCamera;
		this.fov = this.perspectiveCamera.fov;
		this.currentCamera = this.perspectiveCamera as Camera;
		this.controls = this.createArcballControls(
			this.currentCamera,
			renderer,
			threeScene
		) as ArcballControls & { target: Vector3 };
		this.boundingBox = this.getBoundingBox();
		this.boundingBoxMaxDimension = this.getBoundingBoxMaxDimension();
		this.setupControls();
		this.setCameraPerspective(Perspective.TOP);
		this.show(false);
	}

	/**
	 * Creates controls of type {@link ArcballControls}
	 *
	 * @param camera the affected camera
	 * @param renderer the renderer
	 * @returns the created {@link ArcballControls}
	 */
	private createArcballControls(
		camera: Camera,
		renderer: Renderer,
		threeScene: ThreeScene
	): ArcballControls {
		const controls = new ArcballControls(
			camera,
			renderer.domElement,
			threeScene
		);

		controls.setMouseAction(ArcballControlsMouseActionOperations.ROTATE, 1);
		controls.unsetMouseAction(0);

		// TODO: Reenable when signals are used for settings (i.e. when UI can react to changes not made through UI)
		controls.unsetMouseAction(
			"WHEEL",
			ArcballControlsMouseActionKeys.SHIFT
		);

		controls.cursorZoom = true;

		return controls;
	}

	private getBoundingBox(): Box3 {
		const object = this.scene.getModel().getObject();
		object.geometry.computeBoundingBox();
		return object.geometry.boundingBox!;
	}

	private getBoundingBoxMaxDimension(): number {
		const boundingBoxSize = this.boundingBox.getSize(new Vector3());
		return Math.max(
			boundingBoxSize.x,
			boundingBoxSize.y,
			boundingBoxSize.z
		);
	}

	private setupControls(): void {
		this.calculateFitParameters();

		const boundingBoxCenter = this.boundingBox.getCenter(new Vector3());
		this.controls.target.copy(boundingBoxCenter);

		this.controls.update();
	}

	private calculateFitParameters() {
		const multiplier = 1.3;

		// orthographic camera
		const heightZoom =
			Math.abs(
				this.orthographicCamera.bottom - this.orthographicCamera.top
			) /
			(multiplier * this.boundingBoxMaxDimension);
		const widthZoom =
			Math.abs(
				this.orthographicCamera.left - this.orthographicCamera.right
			) /
			(multiplier * this.boundingBoxMaxDimension);
		this.zoom = Math.min(heightZoom, widthZoom);

		// perspective camera
		const heightDistance =
			this.boundingBoxMaxDimension /
			(2 * Math.atan((Math.PI * this.perspectiveCamera.fov) / 360));
		const widthDistance = heightDistance / this.perspectiveCamera.aspect;
		this.distance = multiplier * Math.max(heightDistance, widthDistance);
	}

	public getCamera(): Camera {
		return this.currentCamera;
	}

	public setCamera(type: CameraType) {
		this.setCameraPerspective(Perspective.TOP);

		if (type === "OrthographicCamera") {
			this.currentCamera = this.orthographicCamera as Camera;
		} else if (type === "PerspectiveCamera") {
			this.currentCamera = this.perspectiveCamera as Camera;
		} else {
			assertUnreachable(type);
		}

		this.setCameraPerspective(Perspective.TOP);
		this.controls.setCamera(this.currentCamera);
		this.controls.update();
	}

	public setFOV(fov: number) {
		if (this.currentCamera.isOrthographicCamera) {
			console.error("Can't change FOV on an orthographic camera!");
			return;
		}

		const oldDistance = this.perspectiveCamera.position.distanceTo(
			this.controls.target
		);
		const heightAtTarget =
			oldDistance /
			(2 * Math.atan((Math.PI * this.perspectiveCamera.fov) / 360));
		const newDistance =
			heightAtTarget * 2 * Math.atan((Math.PI * fov) / 360);
		const direction = this.perspectiveCamera.getWorldDirection(
			new Vector3()
		);
		this.perspectiveCamera.position.add(
			direction.multiplyScalar(newDistance - oldDistance)
		);

		this.fov = fov;
		this.perspectiveCamera.fov = fov;
		this.perspectiveCamera.updateProjectionMatrix();
		this.controls.update();

		this.calculateFitParameters();
	}

	public getPerspectiveDistance(): number {
		return this.distance;
	}

	public setCameraPerspective(perspective: Perspective): void {
		if (!this.controls.enabled) {
			return;
		}

		this.controls.reset();

		const distance = this.currentCamera.isPerspectiveCamera
			? this.distance
			: this.boundingBoxMaxDimension * 10;
		const target = this.controls.target.clone();
		switch (perspective) {
			case Perspective.TOP:
				target.setZ(target.z + distance);
				break;
			case Perspective.BOTTOM:
				target.setZ(target.z - distance);
				break;
			case Perspective.LEFT:
				target.setX(target.x + distance);
				break;
			case Perspective.RIGHT:
				target.setX(target.x - distance);
				break;
			case Perspective.FRONT:
				target.setY(target.y + distance);
				break;
			case Perspective.BACK:
				target.setY(target.y - distance);
				break;
			default:
				assertUnreachable(perspective);
		}

		this.currentCamera.position.set(target.x, target.y, target.z);
		if (this.currentCamera.isOrthographicCamera) {
			this.currentCamera.zoom = this.zoom;
			this.currentCamera.updateProjectionMatrix();
		}

		if (this.currentCamera.isPerspectiveCamera) {
			this.perspectiveCamera.fov = this.fov;
		}

		this.controls.update();
	}

	/**
	 * Resets the controls according to the initial values of the ArcballControls
	 */
	public resetControls(): void {
		this.controls.reset();
	}

	/**
	 * Enables the controls
	 */
	public enable(): void {
		this.controls.enabled = true;
		this.scene
			.getCanvas()
			.removeEventListener("contextmenu", preventContextMenu);
	}

	/**
	 * Disables the controls
	 */
	public disable(): void {
		this.controls.enabled = false;
		this.scene
			.getCanvas()
			.addEventListener("contextmenu", preventContextMenu);
	}

	public show(show: boolean): void {
		// TODO: Fix gizmo size in orthographic mode
		this.controls.setGizmosVisible(show);
	}

	/**
	 * Updates the ArcballControls
	 */
	public update(): void {
		// ArcballControls do not need to be updated
	}

	public dispose(): void {
		this.controls.dispose();
		this.scene
			.getCanvas()
			.removeEventListener("contextmenu", preventContextMenu);
	}
}

function preventContextMenu(e: MouseEvent) {
	if (e.button === 2) {
		e.preventDefault();
	}
}
