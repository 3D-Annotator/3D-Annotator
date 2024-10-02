import { type LabeledAnnotationData } from "~entity/Annotation";
import { type Disposable } from "~entity/Types";

export const DEFAULT_OPACITY = 0.6;

/**
 * A vitalizer for AnnotationData
 */
export interface AnnotationVisualizer extends Disposable {
	/**
	 * Visualizes the annotation data with the included label.
	 *
	 * @param data the {@link LabeledAnnotationData}
	 */
	visualize(data: LabeledAnnotationData): void;

	/**
	 * Takes an array of {@link LabeledAnnotationData} and visualizes them all.
	 *
	 * @param data an array of {@link LabeledAnnotationData}
	 */
	visualizeAll(data: LabeledAnnotationData[]): void;

	setOpacity(opacity: number): void;
}
