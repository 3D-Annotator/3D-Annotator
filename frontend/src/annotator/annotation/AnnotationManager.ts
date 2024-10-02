import {
	NEUTRAL_LABEL,
	type AnnotationData,
	type Label,
	type LabeledAnnotationData,
} from "~entity/Annotation";
import {
	type Disposable,
	type Observer,
	type Unsubscribe,
} from "~entity/Types";
import { type LabelManager } from "./LabelManager";

/**
 * The AnnotationManager handles the annotation of data.
 * It informs all observers when a annotation happens.
 */
export class AnnotationManager implements Disposable {
	private readonly observers = new Set<Observer<LabeledAnnotationData>>();

	private readonly annotations: Uint16Array;

	private labelManager: LabelManager;

	/**
	 * Constructs a new AnnotationManager
	 *
	 * @param indexCount the index count of a model
	 * @param labelManager the labelManager
	 */
	constructor(indexCount: number, labelManager: LabelManager) {
		this.annotations = new Uint16Array(indexCount);
		this.initAnnotationsArray();
		this.labelManager = labelManager;
	}

	/**
	 * Sets all annotations to the {@link NEUTRAL_LABEL}
	 */
	private initAnnotationsArray(): void {
		this.annotations.fill(NEUTRAL_LABEL.annotationClass);
	}

	/**
	 * Annotates annotation data with the currently active label
	 *
	 * @param annotationData the annotation data
	 */
	public annotate(annotationData: AnnotationData): void {
		const currentLabel = this.labelManager.getActiveLabel();
		this.annotateWithLabel(currentLabel, annotationData);
	}

	/**
	 * Loads annotation data from existing annotated data stored als {@link LabeledAnnotationData}
	 *
	 * @param annotations the labeled annotation data
	 */
	public loadAnnotations(annotations: LabeledAnnotationData[]) {
		this.initAnnotationsArray();
		for (const { label, data } of annotations) {
			this.annotateWithLabel(label, data);
		}
	}

	/**
	 * Returns the annotations in buffered form
	 *
	 * @returns the annotations as Uint16Array
	 */
	public getAnnotations(): Uint16Array {
		return this.annotations;
	}

	public getLabeledAnnotationsMap(): Map<Label, AnnotationData> {
		const labelMap: Map<number, Label> = this.labelManager.getLabelMap();

		const annotationsMap = new Map<Label, number[]>();
		for (let i = 0; i < this.annotations.length; i++) {
			const annotationClass = this.annotations[i];
			const label = labelMap.get(annotationClass);
			if (label === undefined) {
				throw new Error("Unknown annotationClass found");
			}
			const indices = annotationsMap.get(label);
			if (indices === undefined) {
				annotationsMap.set(label, [i]);
			} else {
				indices.push(i);
			}
		}

		return annotationsMap;
	}

	public getLabeledAnnotations(): LabeledAnnotationData[] {
		const annotationsMap = this.getLabeledAnnotationsMap();
		const labeledAnnotations: LabeledAnnotationData[] = [];
		for (const [label, indices] of annotationsMap.entries()) {
			labeledAnnotations.push({ label: label, data: indices });
		}
		return labeledAnnotations;
	}

	public annotateWithLabel(label: Label, data: number[]) {
		const labelMap = this.labelManager.getLabelMap();
		const editableData = [];
		for (const index of data) {
			const previousLabel = labelMap.get(this.annotations[index]);
			if (previousLabel !== undefined && !previousLabel.locked) {
				editableData.push(index);
			}
		}
		// notifyObservers has to be called before old classes are overwritten
		// because HybridUndoManager needs the old annotations
		this.notifyObservers({ label: label, data: editableData });
		for (const index of editableData) {
			this.annotations[index] = label.annotationClass;
		}
	}

	/**
	 * Like `annotateWithLabel` but ignores locked labels.
	 *
	 * @param label the label
	 * @param data the indexes to annotate
	 */
	public unsafeAnnotateWithLabel(label: Label, data: number[]) {
		// notifyObservers has to be called before old classes are overwritten
		// because HybridUndoManager needs the old annotations
		this.notifyObservers({ label, data });
		for (const index of data) {
			this.annotations[index] = label.annotationClass;
		}
	}

	/**
	 * Adds a annotation observer
	 *
	 * @param observer the observer
	 * @returns the unsubscribe callback
	 */
	public addAnnotationObserver(
		observer: Observer<LabeledAnnotationData>
	): Unsubscribe {
		this.observers.add(observer);
		return () => {
			this.observers.delete(observer);
		};
	}

	/**
	 * Notifies all subscribed observers when a annotation happened
	 *
	 * @param data the LabeledAnnotationData
	 */
	private notifyObservers(data: LabeledAnnotationData) {
		for (const observer of this.observers) {
			observer(data);
		}
	}

	/**
	 * Resets all annotation data and clears all observers
	 */
	public dispose(): void {
		this.initAnnotationsArray();
		this.observers.clear();
	}
}
