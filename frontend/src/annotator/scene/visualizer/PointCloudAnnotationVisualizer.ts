import { type BufferAttribute } from "three";
import { type LabeledAnnotationData } from "~entity/Annotation";
import { type Scene } from "../Scene";
import { type PointCloud } from "../model/PointCloud";
import {
	DEFAULT_OPACITY,
	type AnnotationVisualizer,
} from "./AnnotationVisualizer";

/**
 * A visualizer for point cloud data
 */
export class PointCloudAnnotationVisualizer implements AnnotationVisualizer {
	private readonly scene: Scene<PointCloud>;
	private readonly originalColors: Float32Array;
	private opacity = DEFAULT_OPACITY;

	/**
	 * Constructs a new instance of {@link PointCloudAnnotationVisualizer}
	 *
	 * @param scene a {@link Scene} of type {@link PointCloud}
	 */
	constructor(scene: Scene<PointCloud>) {
		this.scene = scene;
		const geometry = scene.getModel().getPoints().geometry;
		const colorAttribute = geometry.getAttribute(
			"color"
		) as BufferAttribute;
		this.originalColors = Float32Array.from(colorAttribute.array);
	}

	/**
	 * Dispose the visualization
	 * (Currently does nothing)
	 */
	public dispose(): void {
		// nothing to dispose
	}

	public setOpacity(opacity: number): void {
		this.opacity = opacity;
	}

	public visualize({ label, data }: LabeledAnnotationData) {
		const geometry = this.scene.getModel().getPoints().geometry;
		const colorAttr = geometry.getAttribute("color") as BufferAttribute;

		const color = label.color.floatValues;

		const newColorPart =
			label.isNeutral() || !label.annotationVisible ? 0 : this.opacity;
		const originalColorPart = 1 - newColorPart;

		for (const vertex of data) {
			colorAttr.setX(
				vertex,
				color[0] * newColorPart +
					this.originalColors[vertex * 3] * originalColorPart
			);
			colorAttr.setY(
				vertex,
				color[1] * newColorPart +
					this.originalColors[vertex * 3 + 1] * originalColorPart
			);
			colorAttr.setZ(
				vertex,
				color[2] * newColorPart +
					this.originalColors[vertex * 3 + 2] * originalColorPart
			);
		}

		colorAttr.needsUpdate = true;
	}

	public visualizeAll(data: LabeledAnnotationData[]): void {
		const geometry = this.scene.getModel().getPoints().geometry;
		const colorAttr = geometry.getAttribute("color") as BufferAttribute;

		colorAttr.copyArray(this.originalColors);

		for (const currentData of data) {
			this.visualize(currentData);
		}
	}
}
