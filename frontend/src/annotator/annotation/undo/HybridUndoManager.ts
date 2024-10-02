import { ENV } from "env";
import {
	NEUTRAL_LABEL,
	type Label,
	type LabeledAnnotationData,
} from "~entity/Annotation";
import { type Observer, type Unsubscribe } from "~entity/Types";
import { humanReadableDataSize } from "~util/FileUtils";
import { type AnnotationManager } from "../AnnotationManager";
import { type UndoManager, type UndoRedoCount } from "./UndoManager";

const DEBUG = ENV.ANNOTATOR_3D_DEBUG;
const NO_LABEL_CLASS = NEUTRAL_LABEL.annotationClass - 1;

export class HybridUndoManager implements UndoManager {
	private readonly annotationManager: AnnotationManager;
	private readonly unsubscribe: Unsubscribe;

	private active = true;

	private observers = new Set<Observer<UndoRedoCount>>();

	// array with arrays of LabeledAnnotationData, holds overwritten label data
	private backwardAnnotations: LabeledAnnotationData[][];
	private forwardAnnotations: LabeledAnnotationData[][];
	// array for overwritten annotations within one stroke
	private currentAnnotations: Uint16Array;
	// boolean if stroke was started
	private currentlySaving = false;
	// boolean if currentAnnotations is dirty
	private annotated = false;
	// if the limit is a static number of undos or with a memory usage estimation
	private useStaticUndoLimit = false;
	private maxUndos = 10;
	// rough estimation of a maximum amount of memory for undos & redos
	private maxUndoMemory = 100 * Math.pow(2, 20);
	private memoryUsed = 0;
	// placeholder annotation class to mark empty entries in currentAnnotations
	// only needed because there is no reference to the label manager anymore
	// alternatively the labels can be an argument of endStroke()
	private readonly labelMap: Map<number, Label>;

	constructor(annotationManager: AnnotationManager) {
		this.annotationManager = annotationManager;
		this.unsubscribe = annotationManager.addAnnotationObserver(
			this.onAnnotation.bind(this)
		);

		this.backwardAnnotations = [];
		this.forwardAnnotations = [];
		this.currentAnnotations = new Uint16Array(
			annotationManager.getAnnotations().length
		);
		this.currentAnnotations.fill(NO_LABEL_CLASS);
		this.labelMap = new Map();
		this.labelMap.set(NEUTRAL_LABEL.annotationClass, NEUTRAL_LABEL);
	}

	/**
	 * Resets saved undos/redos or the current stroke
	 *
	 * @param hard if true, resets all redos/undos otherwise only resets current stroke
	 */
	reset(hard = false): void {
		if (hard) {
			this.memoryUsed = 0;
			this.backwardAnnotations = [];
			this.forwardAnnotations = [];
			this.notifyUndoRedoCountObservers();
		}
		this.currentlySaving = false;
		this.annotated = false;
		this.currentAnnotations.fill(NO_LABEL_CLASS);
	}

	dispose(): void {
		this.observers.clear();
		this.unsubscribe();
	}

	activate(): void {
		this.active = true;
	}

	deactivate(): void {
		this.active = false;
	}

	public getMaxUndoStatic(): number {
		return this.maxUndos;
	}

	public getMaxUndoMemory(): number {
		return this.maxUndoMemory;
	}

	public hasUndo(): boolean {
		return this.backwardAnnotations.length !== 0;
	}

	public hasRedo(): boolean {
		return this.forwardAnnotations.length !== 0;
	}

	public addUndoRedoCountObserver(
		observer: Observer<UndoRedoCount>
	): Unsubscribe {
		this.observers.add(observer);
		return () => {
			this.observers.delete(observer);
		};
	}

	private notifyUndoRedoCountObservers() {
		for (const observer of this.observers) {
			observer({
				undos: this.backwardAnnotations.length,
				redos: this.forwardAnnotations.length,
			});
		}
	}

	/**
	 * Sets wether the manager should limit the undos/redos saved, using a static maximum of undos,
	 * or using a rough memory usage limit.
	 *
	 * @param useStatic wether to use a static or a memory limit
	 * @returns void
	 */
	public setUseStaticUndoLimit(useStatic: boolean) {
		if (this.useStaticUndoLimit === useStatic) return;
		this.useStaticUndoLimit = useStatic;

		if (this.useStaticUndoLimit) {
			this.setMaxUndoStatic(this.maxUndos);
		} else {
			this.memoryUsed = this.getDataArraySize(this.backwardAnnotations);
			this.setMaxUndoMemory(this.maxUndoMemory);
		}
	}

	/**
	 * Sets the maximum number of redos/undos.
	 * If the new maximum is less than what is currently used, undo and redo data is dropped to adjust to the new value.
	 *
	 * @param n maximum number of redos/undos the manager saves
	 * @returns void
	 */
	public setMaxUndoStatic(n: number) {
		if (n < 0) {
			throw new Error("Cannot set Maximum undos to a negative value!");
		}
		this.maxUndos = n;

		if (!this.useStaticUndoLimit) return;

		while (
			this.backwardAnnotations.length + this.forwardAnnotations.length >
				n &&
			this.backwardAnnotations.length !== 0
		) {
			this.backwardAnnotations.shift();
		}
		while (this.forwardAnnotations.length > n) {
			this.forwardAnnotations.shift();
		}

		this.notifyUndoRedoCountObservers();
	}

	/**
	 * Sets the max memory usage of the undo data. Only a rough estimation.
	 * If the new maximum is less than what is currently used, undo and redo data is dropped to adjust to the new value.
	 *
	 * @param n rough maximum of memory the undo manager should use
	 * @returns void
	 */
	public setMaxUndoMemory(n: number) {
		if (n < 0) {
			throw new Error("Cannot set Maximum undos to a negative value!");
		}
		this.maxUndoMemory = n;

		if (this.useStaticUndoLimit) return;

		let redoSum = this.getDataArraySize(this.forwardAnnotations);

		// delete old undo/redo data until undo + redo usage is lower than new MAX
		while (
			this.memoryUsed + redoSum > n &&
			this.backwardAnnotations.length !== 0
		) {
			const oldData = this.backwardAnnotations.shift();
			this.memoryUsed -= this.getDataSize(oldData!) * 10;
		}
		while (redoSum > n && this.forwardAnnotations.length !== 0) {
			const oldData = this.forwardAnnotations.shift();
			redoSum -= this.getDataSize(oldData!) * 10;
		}

		this.notifyUndoRedoCountObservers();
	}

	/**
	 * Starts a stroke to save is as undo/redo.
	 */
	public startGroup() {
		this.currentlySaving = true;
	}

	/**
	 * Marks the active stroke as ended and saves it for undos/redos.
	 *
	 * @param saveToForward if true, the current stroke is saved as redo. The Default is false.
	 * 						Should only be used internally
	 * @param deleteForward if true, the redos get deleted if the current stroke is saved. Default is true.
	 * 						Should only be used internally.
	 * @returns void
	 */
	public endGroup(saveToForward = false, deleteForward = true) {
		if (!this.currentlySaving) return;
		this.currentlySaving = false;

		// empty stroke gets ignored
		if (!this.annotated) return;
		this.annotated = false;

		// delete forward annotations to not have branches
		if (deleteForward) {
			this.forwardAnnotations = [];
		}

		// collect all indices with the same annotationClass and get their label
		const annotationData = this.convertAnnotations();

		const size = this.getDataSize(annotationData) * 10;

		if (!saveToForward) {
			if (!this.useStaticUndoLimit) {
				// if memory estimation is more than MAX, don't save stroke
				if (size > this.maxUndoMemory) return;

				// delete oldest saved undos until enough memory is free
				while (
					this.memoryUsed + size > this.maxUndoMemory &&
					this.backwardAnnotations.length !== 0
				) {
					const oldData = this.backwardAnnotations.shift();
					this.memoryUsed -= this.getDataSize(oldData!) * 10;
				}

				this.memoryUsed += size;
			} else {
				if (this.backwardAnnotations.length >= this.maxUndos) {
					this.backwardAnnotations.shift();
				}
			}
			this.backwardAnnotations.push(annotationData);
		} else {
			// redo data can never exceed undo data, therefore no limit
			if (!this.useStaticUndoLimit) {
				this.memoryUsed -= size;
			}
			this.forwardAnnotations.push(annotationData);
		}

		this.notifyUndoRedoCountObservers();

		if (DEBUG) {
			// interesting rough estimation of saved data:
			const used = humanReadableDataSize(this.memoryUsed);
			const max = humanReadableDataSize(this.maxUndoMemory);
			const percent = (this.memoryUsed / this.maxUndoMemory) * 100;
			const percentString = percent.toFixed(2) + "%";
			console.log(
				`undo/redo: roughly ${used} of ${max} (${percentString}) used`
			);
		}
	}

	public undo(): void {
		// just in case undo is called in midst stroke
		this.endGroup(false, false);

		// no undos to apply
		if (this.backwardAnnotations.length === 0) return;

		// start group to save labels overwritten from undo as redo data
		this.startGroup();
		const annotationDataArr = this.backwardAnnotations.pop()!;
		for (const { label, data } of annotationDataArr) {
			this.annotationManager.unsafeAnnotateWithLabel(label, data);
		}

		// save stroke as redo data and don't delete redos
		this.endGroup(true, false);
	}

	public redo(): void {
		// just in case undo is called in midst stroke
		this.endGroup(false, false);

		// no undos to apply
		if (this.forwardAnnotations.length === 0) return;

		// start group to save labels overwritten from redo as undo data
		this.startGroup();
		const annotationDataArr = this.forwardAnnotations.pop()!;
		for (const { label, data } of annotationDataArr) {
			this.annotationManager.unsafeAnnotateWithLabel(label, data);
		}

		// save stroke as undo data and don't delete redos
		this.endGroup(false, false);
	}

	private onAnnotation(newAnnotationData: LabeledAnnotationData): void {
		if (!this.active) {
			return;
		}

		this.labelMap.set(
			newAnnotationData.label.annotationClass,
			newAnnotationData.label
		);

		const annotationArray = this.annotationManager.getAnnotations();

		if (this.currentlySaving) {
			this.annotated = true;
			for (const index of newAnnotationData.data) {
				// check for earlier annotation to avoid overwriting old label with label of stroke
				if (this.currentAnnotations[index] !== NO_LABEL_CLASS) continue;
				this.currentAnnotations[index] = annotationArray[index];
			}
		}
	}

	private convertAnnotations(): LabeledAnnotationData[] {
		// map to collect all indices with the same label/annotation class
		const annotations = new Map<number, LabeledAnnotationData>();
		for (let index = 0; index < this.currentAnnotations.length; index++) {
			const annotationClass = this.currentAnnotations[index];
			if (annotationClass === NO_LABEL_CLASS) continue;
			this.currentAnnotations[index] = NO_LABEL_CLASS;
			const aData = annotations.get(annotationClass);
			if (aData === undefined) {
				const label = this.labelMap.get(annotationClass);
				if (label === undefined) {
					throw new Error(
						"Unknown annotation class was overwritten!"
					);
				}
				annotations.set(annotationClass, {
					label: label,
					data: [index],
				});
			} else {
				aData.data.push(index);
			}
		}
		// collect all LabeledAnnotationData in array
		const array = Array.from(annotations.values());

		return array;
	}

	/**
	 * Sums the number of saved annotationClasses in the given data.
	 *
	 * @param annoData Array of LabeledAnnotationData
	 * @returns number of annotationClasses saved in annoData
	 */
	private getDataSize(annoData: LabeledAnnotationData[]): number {
		let size = 0;
		for (const labeledAnnotationData of annoData) {
			size += labeledAnnotationData.data.length;
		}
		return size;
	}

	private getDataArraySize(annoDataArray: LabeledAnnotationData[][]): number {
		let sum = 0;
		for (const dataArray of annoDataArray) {
			sum += this.getDataSize(dataArray);
		}
		return sum;
	}
}
