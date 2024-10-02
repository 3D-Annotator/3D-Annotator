import { type ToolButtonProps } from "~annotator/tools/Tool";
import { ToolButton } from "~ui/components/ToolButton";
import Lasso from "./lasso.png";

/**
 * The button component to select the LassoTool
 *
 * @param props the component props
 * @returns the button component
 */
export function PointCloudLassoButton({ onClick, selected }: ToolButtonProps) {
	return (
		<ToolButton
			imagePath={Lasso}
			toolAlt="Lasso"
			toolFunc={onClick}
			selected={selected}
		/>
	);
}
