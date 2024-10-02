import { type BufferAttribute, type BufferGeometry } from "three";
import { type LabeledAnnotationData } from "~entity/Annotation";
import { type Scene } from "../Scene";
import { type Mesh } from "../model/Mesh";
import {
	DEFAULT_OPACITY,
	type AnnotationVisualizer,
} from "./AnnotationVisualizer";

/**
 * A visualizer for mesh data
 */
export class MeshAnnotationVisualizer implements AnnotationVisualizer {
	private readonly geometry: BufferGeometry;
	private readonly originalColors: Float32Array | undefined;
	private opacity = DEFAULT_OPACITY;

	/**
	 * Constructs a new instance of {@link MeshAnnotationVisualizer}
	 *
	 * @param scene a {@link Scene} of type {@link Mesh}
	 */
	constructor(scene: Scene<Mesh>) {
		this.geometry = scene.getModel().getMesh().geometry;
		const colorAttribute = this.geometry.getAttribute(
			"color"
		) as BufferAttribute;
		if (colorAttribute.itemSize === 3) {
			this.originalColors = Float32Array.from(colorAttribute.array);
		}
	}

	public setOpacity(opacity: number): void {
		this.opacity = opacity;
	}

	/**
	 * Dispose the visualization
	 * (Currently does nothing)
	 */
	public dispose(): void {
		// nothing to dispose
	}

	public visualize(data: LabeledAnnotationData) {
		const colorAttribute = this.geometry.getAttribute("color");

		if (colorAttribute.itemSize === 3) {
			this.visualizeWithoutTexture(data);
		} else if (colorAttribute.itemSize === 4) {
			this.visualizeWithTexture(data);
		} else {
			throw new Error("Unexpected color attribute item size.");
		}
	}

	public visualizeAll(data: LabeledAnnotationData[]): void {
		const colorAttribute = this.geometry.getAttribute(
			"color"
		) as BufferAttribute;

		const array = colorAttribute.array as Uint8Array;
		array.fill(0);

		for (const currentData of data) {
			this.visualize(currentData);
		}
	}

	private visualizeWithTexture({ label, data }: LabeledAnnotationData) {
		const color = label.color.floatValues;
		// set alpha value
		color[3] =
			label.isNeutral() || !label.annotationVisible ? 0 : this.opacity;

		/*
			Each mesh face has three vertices. Each vertex needs to be colored
			with "color". In three.js the color attribute stores a 32-bit RGBA
			value for each vertex in one single Uint8 array.
			=> The colors for one face are 3 times a 4 byte value.
		*/
		const colorVector = new Float32Array(12);
		for (let i = 0; i < 3; i++) {
			colorVector.set(color, i * color.length);
		}
		const colorAttr = this.geometry.getAttribute(
			"color"
		) as BufferAttribute;

		for (const faceIndex of data) {
			// times 3 gets the vertex index (3 vertices per face)
			// times 4 gets the color index of the vertex (4 color values per vertex)
			const colorIndex = faceIndex * 3 * 4;
			colorAttr.set(colorVector, colorIndex);
		}
		colorAttr.needsUpdate = true;
	}

	private visualizeWithoutTexture({ label, data }: LabeledAnnotationData) {
		const colorAttribute = this.geometry.getAttribute(
			"color"
		) as BufferAttribute;

		const labelColor = label.color.floatValues;

		const newColorPart =
			label.isNeutral() || !label.annotationVisible ? 0 : this.opacity;
		const originalColorPart = 1 - newColorPart;

		for (const faceIndex of data) {
			/*
			 * times 3 gets the vertex index (3 vertices per face)
			 * times 3 gets the color index of the vertex (3 color values per vertex)
			 * => 3 * 3 = 9
			 */
			const resultingColor = [
				labelColor[0] * newColorPart +
					this.originalColors![faceIndex * 9] * originalColorPart,
				labelColor[1] * newColorPart +
					this.originalColors![faceIndex * 9 + 1] * originalColorPart,
				labelColor[2] * newColorPart +
					this.originalColors![faceIndex * 9 + 2] * originalColorPart,
			];

			const colorVector = new Float32Array(9);
			for (let i = 0; i < 3; i++) {
				colorVector.set(resultingColor, i * resultingColor.length);
			}

			colorAttribute.set(colorVector, faceIndex * 9);
		}

		colorAttribute.needsUpdate = true;
	}
}
