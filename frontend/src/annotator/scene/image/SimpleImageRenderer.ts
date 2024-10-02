import { type Camera, type Renderer, type Scene as ThreeScene } from "three";
import { type ImageRenderer } from "./ImageRenderer";

/**
 * A SimpleImageRenderer to render a simple representation of the rendered content
 */
export class SimpleImageRenderer implements ImageRenderer {
	private readonly renderer: Renderer;
	private readonly scene: ThreeScene;
	private readonly camera: Camera;

	/**
	 * Constructs a new simple SimpleImageRenderer
	 *
	 * @param renderer the renderer
	 * @param scene the scene
	 * @param camera the camera
	 */
	constructor(renderer: Renderer, scene: ThreeScene, camera: Camera) {
		this.renderer = renderer;
		this.scene = scene;
		this.camera = camera;
	}
	/**
	 * Takes the current content of the renderer and returns it async.
	 *
	 * @returns the content of the renderer as blob as a promise.
	 */
	public async render(): Promise<Blob> {
		return new Promise((resolve, reject) => {
			this.renderer.render(this.scene, this.camera);
			this.renderer.domElement.toBlob((blob) => {
				if (blob) {
					resolve(blob);
				} else {
					reject("canvas.toBlob() failed");
				}
			});
		});
	}
}
