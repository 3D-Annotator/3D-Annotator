import { type Scene as ThreeScene } from "three";
import type Stats from "three/examples/jsm/libs/stats.module";
import { type Scene } from "./Scene";
import { type ImageRenderer } from "./image/ImageRenderer";
import { SimpleImageRenderer } from "./image/SimpleImageRenderer";
import type { GlobalLighting } from "./lighting/GlobalLighting";
import type { SunLighting } from "./lighting/SunLighting";
import { type Model } from "./model/Model";
import type { PointCloud } from "./model/PointCloud";

/**
 * A SceneManager
 */
export class SceneManager {
	private readonly scene: Scene<Model>;
	private readonly imageRenderer: ImageRenderer;
	private readonly stats: Stats;

	/**
	 * Constructs a new instance of SceneManager
	 *
	 * @param scene the scene (for running everything around the )
	 * @param threeScene the {@link THREE.Scene}
	 * @param stats the performance stats
	 */
	constructor(scene: Scene<Model>, threeScene: ThreeScene, stats: Stats) {
		this.scene = scene;
		this.imageRenderer = new SimpleImageRenderer(
			scene.renderer,
			threeScene,
			scene.camera
		);
		this.stats = stats;
	}

	public getCameraControls() {
		return this.scene.getCameraControls();
	}

	/**
	 * Returns the dom element for the stats
	 *
	 * @returns the dom element
	 */
	public getStatsElement() {
		return this.stats.dom;
	}

	/**
	 * Returns the current render content
	 *
	 * @returns
	 */
	public renderImage(): Promise<Blob> {
		return this.imageRenderer.render();
	}

	public getGlobalLighting(): GlobalLighting {
		return this.scene.getGlobalLighting();
	}

	public getSunLighting(): SunLighting {
		return this.scene.getSunLighting();
	}

	public setPointSize(size: number) {
		const model = this.scene.getModel() as PointCloud;
		model.setPointSize(size);
	}
}
