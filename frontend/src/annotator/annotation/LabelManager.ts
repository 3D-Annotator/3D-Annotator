import { NEUTRAL_LABEL, type Label } from "~entity/Annotation";
import { type Observer, type Unsubscribe } from "~entity/Types";

/**
 * Menages labels and shares the information about them
 */
export class LabelManager {
	private readonly activeLabelObservers = new Set<Observer<Label>>();
	private readonly labelsObservers = new Set<Observer<Label[]>>();

	private labels: Set<Label>;
	private labelMap: Map<number, Label>;
	private activeLabel: Label;

	/**
	 * Constructs a new instance of a LabelManager
	 *
	 * @param labels
	 */
	constructor(labels: Label[]) {
		if (labels.length === 0) {
			throw new Error("'labels' is empty");
		}
		this.labels = new Set(labels);
		this.labelMap = this.generateLabelMap(labels);
		this.activeLabel = labels[0];
	}

	private generateLabelMap(labels: Label[]): Map<number, Label> {
		const labelMap = new Map<number, Label>();
		for (const label of labels) {
			labelMap.set(label.annotationClass, label);
		}
		labelMap.set(NEUTRAL_LABEL.annotationClass, NEUTRAL_LABEL);
		return labelMap;
	}

	/**
	 * Adds a observer listening to the active label
	 *
	 * @param observer the observer
	 * @returns the unsubscribe callback
	 */
	public addActiveLabelObserver(observer: Observer<Label>): Unsubscribe {
		this.activeLabelObservers.add(observer);
		observer(this.activeLabel);
		return () => {
			this.activeLabelObservers.delete(observer);
		};
	}

	/**
	 * Notifies all subscribed observers when the active label changes
	 */
	private notifyActiveLabelObservers() {
		for (const observer of this.activeLabelObservers) {
			observer(this.activeLabel);
		}
	}

	/**
	 * Adds a label observer
	 *
	 * @param observer the observer
	 * @returns the unsubscribe callback
	 */
	public addLabelsObserver(observer: Observer<Label[]>): Unsubscribe {
		this.labelsObservers.add(observer);
		observer(this.getLabels());
		return () => {
			this.labelsObservers.delete(observer);
		};
	}

	/**
	 * Notifies all subscribed label observers
	 */
	private notifyLabelsObservers() {
		const array = this.getLabels();
		for (const observer of this.labelsObservers) {
			observer(array);
		}
	}

	/**
	 * Returns the active label
	 *
	 * @returns the active label
	 */
	public getActiveLabel(): Label {
		return this.activeLabel;
	}

	/**
	 * Sets the active label
	 *
	 * @param label the label
	 */
	public selectLabel(label: Label): void {
		if (!this.labels.has(label)) {
			throw new Error("'label' not found in LabelManager");
		}

		this.activeLabel = label;
		this.notifyActiveLabelObservers();
	}

	/**
	 * Selects the eraser (the {@link NEUTRAL_LABEL} will be selected)
	 */
	public selectEraser(): void {
		this.activeLabel = NEUTRAL_LABEL;
		this.notifyActiveLabelObservers();
	}

	/**
	 * Returns true when the eraser is currently selected
	 *
	 * @returns true when the eraser is currently selected
	 */
	public isEraserSelected(): boolean {
		return this.activeLabel.isNeutral();
	}

	/**
	 * Returns a copy of the label array
	 *
	 * @returns a copy of the label array
	 */
	public getLabels(): Label[] {
		return [...this.labels];
	}

	/**
	 * Returns the label map including the neutral label.
	 *
	 * @returns the label map including the neutral label
	 */
	public getLabelMap(): Map<number, Label> {
		return this.labelMap;
	}

	/**
	 * Updates the label array
	 *
	 * @param labels the new label array
	 * @param selectedLabel the optional selected label
	 */
	public updateLabels(labels: Label[], selectedLabel?: Label): void {
		if (labels.length === 0) {
			throw new Error("'labels' is empty");
		}

		const newLabels = new Set(labels);

		if (selectedLabel && !newLabels.has(selectedLabel)) {
			throw new Error("'labels' does not contain 'selectedLabel'");
		}

		let activeLabelChanged = false;
		if (selectedLabel && selectedLabel !== this.activeLabel) {
			this.activeLabel = selectedLabel;
			activeLabelChanged = true;
		} else if (
			!this.containsLabelByAnnotationClass(this.activeLabel, newLabels)
		) {
			this.activeLabel = labels[0];
			activeLabelChanged = true;
		}

		this.labels = newLabels;
		this.labelMap = this.generateLabelMap(labels);

		this.notifyLabelsObservers();

		if (activeLabelChanged) {
			this.notifyActiveLabelObservers();
		}
	}

	/**
	 * Returns true if labels contains a label with the same annotation class as label
	 *
	 * @param label the label
	 * @param labels the labels
	 * @returns true if the label is contained
	 */
	private containsLabelByAnnotationClass(label: Label, labels: Set<Label>) {
		for (const currentLabel of labels) {
			if (currentLabel.annotationClass === label.annotationClass) {
				return true;
			}
		}
		return false;
	}
}
