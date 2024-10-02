import { useI18nContext } from "i18n/i18n-react";
import type { ToolButtonProps } from "~annotator/tools/Tool";
import { ToolButton } from "~ui/components/ToolButton";
import Brush from "./brush.png";

/**
 * The button component to select the LightThrower
 *
 * @param props the component props
 * @returns the button component
 */
export function PointCloudBrushButton({ onClick, selected }: ToolButtonProps) {
	const { LL } = useI18nContext();
	return (
		<ToolButton
			imagePath={Brush}
			toolAlt={LL.BRUSH()}
			toolFunc={onClick}
			selected={selected}
		/>
	);
}
