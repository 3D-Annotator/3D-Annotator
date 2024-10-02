import { useEffect, useState } from "react";
import type { Label } from "~entity/Annotation";
import { useAnnotator } from "../contexts/AnnotatorContext";

export function useLabels() {
	const [labels, setLabels] = useState<Label[]>([]);
	const [currentLabel, setCurrentLabel] = useState<Label | null>(null);
	const [isEraserSelected, setIsEraserSelected] = useState(false);
	const annotator = useAnnotator();

	useEffect(() => {
		if (!annotator) return;

		const labels = annotator.labelManager.getLabels();
		setLabels(labels);
		setCurrentLabel(labels[0]);

		const unsubscribe = annotator.labelManager.addActiveLabelObserver(
			(label) => {
				if (label.isNeutral()) {
					setIsEraserSelected(true);
				} else {
					setIsEraserSelected(false);
					setCurrentLabel(label);
				}
			}
		);

		return unsubscribe;
	}, [annotator]);

	function notifyLabelChange() {
		if (!annotator) return;

		setLabels(annotator.labelManager.getLabels());
	}

	return {
		labels,
		currentLabel,
		isEraserSelected,
		notifyLabelChange,
	};
}
