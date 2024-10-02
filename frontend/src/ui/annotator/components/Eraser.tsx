import { useI18nContext } from "i18n/i18n-react";
import EraserIcon from "~assets/icons/eraser.png";
import { useAnnotator } from "~ui/annotator/contexts/AnnotatorContext";
import { useLabels } from "~ui/annotator/hooks/Labels";
import { ToolButton } from "~ui/components/ToolButton";

export function Eraser() {
	const { LL } = useI18nContext();
	const annotator = useAnnotator();

	const { currentLabel, isEraserSelected } = useLabels();

	function onEraserSelectedHandler() {
		if (!annotator) return;

		if (isEraserSelected && currentLabel) {
			annotator.labelManager.selectLabel(currentLabel);
		} else {
			annotator.labelManager.selectEraser();
		}
	}

	return (
		<ToolButton
			imagePath={EraserIcon}
			toolAlt={LL.ERASER()}
			toolFunc={onEraserSelectedHandler}
			selected={isEraserSelected}
		/>
	);
}
