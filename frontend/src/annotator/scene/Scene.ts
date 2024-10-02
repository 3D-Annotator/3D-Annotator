import { ok, type Result } from "neverthrow";
import {
	OrthographicCamera,
	PerspectiveCamera,
	Color as ThreeColor,
	Scene as ThreeScene,
	WebGLRenderer,
	type Renderer,
} from "three";
import Stats from "three/examples/jsm/libs/stats.module";
import {
	type Disposable,
	type Observer,
	type Unsubscribe,
} from "~entity/Types";
import { type Camera } from "./Camera";
import { ArcballCameraControls } from "./controls/ArcballCameraControls";
import { type CameraControls } from "./controls/CameraControls";
import { GlobalLighting } from "./lighting/GlobalLighting";
import { SunLighting } from "./lighting/SunLighting";
import { type LoaderError } from "./model/loader/Loader";
import { type Model } from "./model/Model";
import { SceneManager } from "./SceneManager";
import { type SceneSubject } from "./SceneSubject";

// background color of the scene
export const ANNOTATOR_BG_COLOR = "#3C3C3C";

const BG_COLOR = new ThreeColor(ANNOTATOR_BG_COLOR);

const ORTHOGRAPHIC_CAMERA_CONFIG = {
	FRUSTUM_SIZE: 100,
	MIN_CLIP: 0.1,
	MAX_CLIP: 100000,
};

const PERSPECTIVE_CAMERA_CONFIG = {
	// camera field of view
	FOV: 30,
	// min. distance of visible objects
	MIN_CLIP: 0.1,
	// max. distance of visible objects
	MAX_CLIP: 10000,
	// initial x position of the camera
	INIT_CAM_X: 0,
};

export abstract class Scene<T extends Model> implements Disposable {
	private readonly orthographicCamera: OrthographicCamera;
	private readonly perspectiveCamera: PerspectiveCamera;

	public readonly renderer: Renderer;

	protected model?: T;

	private readonly parentElement: HTMLDivElement;
	private readonly resizeHandler: () => void;
	private readonly scene: ThreeScene;
	private readonly sceneSubjects = new Set<SceneSubject>();
	private readonly renderObservers = new Set<Observer<void>>();

	private cameraControls?: CameraControls;

	private readonly stats = new Stats();

	private running = false;

	private globalLighting = new GlobalLighting();

	private sunLighting: SunLighting;

	/**
	 * Constructs a new Scene
	 *
	 * @param sceneParent the element which to add the rendere's dom element to
	 */
	constructor(sceneParent: HTMLDivElement) {
		this.parentElement = sceneParent;
		const rect = sceneParent.getBoundingClientRect();

		this.perspectiveCamera = this.createPerspectiveCamera(
			rect.width,
			rect.height
		);
		this.orthographicCamera = this.createOrthographicCamera(
			rect.width,
			rect.height
		);

		this.scene = new ThreeScene();

		this.sunLighting = new SunLighting(this);

		this.renderer = this.createRenderer(rect.width, rect.height);

		this.resizeHandler = this.handleResize.bind(this);
	}

	/**
	 * Sets the Scene up
	 */
	public setup() {
		this.addSceneSubject(this.globalLighting);
		this.addSceneSubject(this.sunLighting);
		this.parentElement.appendChild(this.renderer.domElement);
		window.addEventListener("resize", this.resizeHandler);
	}

	/**
	 * Creates a SceneManager
	 *
	 * @returns the SceneManager
	 */
	public createSceneManager(): SceneManager {
		return new SceneManager(this, this.scene, this.stats);
	}

	/**
	 * Adds a new render observer to the scene manager.
	 * All render observers are called **inside** the requestAnimationFrame callback
	 * **before** the renderer and the camera controls are updated.
	 *
	 * To unsubscribe the observer, call the returned unsubscribe function.
	 *
	 * @param observer the observer to be added
	 * @returns the unsubscribe function
	 */
	public addRenderObserver(observer: Observer<void>): Unsubscribe {
		this.renderObservers.add(observer);

		return () => {
			this.renderObservers.delete(observer);
		};
	}

	/**
	 * Notifies all subscribed Observers.
	 */
	private notifyRenderObservers() {
		for (const observer of this.renderObservers) {
			observer();
		}
	}

	/**
	 * Creates a Model initializes it and adds it to to the scene subject array.
	 *
	 * @param files the model files
	 * @param onProgress the {@link observer}
	 */
	public async initializeModel(
		files: File[],
		onProgress?: Observer<number>
	): Promise<Result<undefined, LoaderError>> {
		this.model = this.createModel();
		const res = await this.model.initializeModel(files, onProgress);
		if (res.isErr()) {
			return res;
		}
		this.addSceneSubject(this.model);

		this.cameraControls = new ArcballCameraControls(
			this,
			this.orthographicCamera,
			this.perspectiveCamera,
			this.renderer,
			this.scene
		);
		this.scene.add(this.orthographicCamera);
		this.scene.add(this.perspectiveCamera);

		return ok(undefined);
	}

	/**
	 * Creates a Model
	 *
	 * @returns a model of type T
	 */
	protected abstract createModel(): T;

	public startRenderLoop(): void {
		this.running = true;
		this.update();
	}

	/**
	 * 1. Updates the camera controls and all scene subjects
	 * 2. then notifies all render observers,
	 * 3. then requests new Animation frame.
	 * Update is executed recursively and can be topped when this.running is set to false.
	 */
	private update(): void {
		if (!this.running) {
			return;
		}

		this.stats.begin();

		this.cameraControls!.update();

		for (const subject of this.sceneSubjects) {
			subject.update();
		}

		this.notifyRenderObservers();
		this.renderer.render(this.scene, this.camera);

		this.stats.end();
		requestAnimationFrame(this.update.bind(this));
	}

	/**
	 * stops the render loop
	 */
	public stopRenderLoop(): void {
		this.running = false;
	}

	/**
	 * The currently active camera.
	 *
	 * Throws an error if the model is not yet initialized.
	 */
	public get camera(): Camera {
		if (!this.cameraControls) {
			throw new Error("Camera not initialized, use initializeModel()");
		}

		return this.cameraControls.getCamera();
	}

	public get cameras(): Camera[] {
		return [
			this.orthographicCamera as Camera,
			this.perspectiveCamera as Camera,
		];
	}

	/**
	 * Returns the camera controls
	 * @returns the camera controls
	 */
	public getCameraControls() {
		if (!this.cameraControls) {
			throw new Error("Controls not initialized, use initializeModel().");
		}
		return this.cameraControls;
	}

	/**
	 * returns the currently used Model
	 * @returns the Model
	 */
	public getModel(): T {
		if (!this.model) {
			throw new Error("Model not initialized, use initializeModel().");
		}
		return this.model;
	}

	public getGlobalLighting(): GlobalLighting {
		if (!this.globalLighting) {
			throw new Error("Lighting not initialized.");
		}
		return this.globalLighting;
	}

	public getSunLighting(): SunLighting {
		if (!this.sunLighting) {
			throw new Error("Lighting not initialized.");
		}
		return this.sunLighting;
	}

	/**
	 * Adds a new scene subject to the scene and adds it to the list of scene subjects
	 *
	 * @param sceneSubject the scene subject
	 */
	public addSceneSubject(sceneSubject: SceneSubject): void {
		this.sceneSubjects.add(sceneSubject);
		this.scene.add(...sceneSubject.getObjects());
	}

	/**
	 * Removes the scene subject from the scene and removes it from the list of scene subjects
	 *
	 * @param sceneSubject the scene subject
	 */
	public removeSceneSubject(sceneSubject: SceneSubject): void {
		this.scene.remove(...sceneSubject.getObjects());
		this.sceneSubjects.delete(sceneSubject);
		sceneSubject.dispose();
	}

	/**
	 * Disposes the render loop
	 * 1. stops render loop
	 * 2. clears all observers
	 * 2. clears the scene
	 * 3. disposes all scene subjects
	 * 4. clears all scene subjects
	 * 5. disposes the camera controls
	 */
	public dispose() {
		this.stopRenderLoop();

		if (this.parentElement.contains(this.renderer.domElement)) {
			this.parentElement.removeChild(this.renderer.domElement);
		}

		window.removeEventListener("resize", this.resizeHandler);

		this.renderObservers.clear();

		this.scene.clear();

		for (const subject of this.sceneSubjects) {
			subject.dispose();
		}
		this.sceneSubjects.clear();

		if (this.cameraControls) {
			this.cameraControls.dispose();
			this.cameraControls = undefined;
		}
	}

	/**
	 * Returns the canvas element
	 *
	 * @returns the canvas element
	 */
	public getCanvas(): HTMLCanvasElement {
		return this.renderer.domElement;
	}

	private createPerspectiveCamera(
		width: number,
		height: number
	): PerspectiveCamera {
		const aspectRatio = width / height;
		const camera = new PerspectiveCamera(
			PERSPECTIVE_CAMERA_CONFIG.FOV,
			aspectRatio,
			PERSPECTIVE_CAMERA_CONFIG.MIN_CLIP,
			PERSPECTIVE_CAMERA_CONFIG.MAX_CLIP
		);
		return camera;
	}

	private createOrthographicCamera(
		width: number,
		height: number
	): OrthographicCamera {
		const aspectRatio = width / height;
		const frustumSize = ORTHOGRAPHIC_CAMERA_CONFIG.FRUSTUM_SIZE;
		const camera = new OrthographicCamera(
			(frustumSize * aspectRatio) / -2,
			(frustumSize * aspectRatio) / 2,
			frustumSize / 2,
			-frustumSize / 2,
			ORTHOGRAPHIC_CAMERA_CONFIG.MIN_CLIP,
			ORTHOGRAPHIC_CAMERA_CONFIG.MAX_CLIP
		);
		return camera;
	}

	/**
	 * Creates a new WebGLRenderer
	 * @return the renderer
	 */
	private createRenderer(width: number, height: number): Renderer {
		const renderer = new WebGLRenderer({
			antialias: true,
		});
		renderer.setClearColor(BG_COLOR);
		renderer.setSize(width, height);
		return renderer;
	}

	private handleResize() {
		const rect = this.parentElement.getBoundingClientRect();
		const newAspectRatio = rect.width / rect.height;

		// orthographic camera
		const frustumSize = ORTHOGRAPHIC_CAMERA_CONFIG.FRUSTUM_SIZE;
		this.orthographicCamera.left = (frustumSize * newAspectRatio) / -2;
		this.orthographicCamera.right = (frustumSize * newAspectRatio) / 2;
		this.orthographicCamera.top = frustumSize / 2;
		this.orthographicCamera.bottom = -frustumSize / 2;
		this.orthographicCamera.updateProjectionMatrix();

		// perspective camera
		this.perspectiveCamera.aspect = newAspectRatio;
		this.perspectiveCamera.updateProjectionMatrix();

		this.renderer.setSize(rect.width, rect.height);
	}
}
