import { type ToolButtonProps } from "~annotator/tools/Tool";
import { ToolButton } from "~ui/components/ToolButton";
import Brush3D from "./brush3D.png";

/**
 * The button component to select the PointBrush
 *
 * @param props the component props
 * @returns the button component
 */
export function PointCloudBrush3DButton({
	onClick,
	selected,
}: ToolButtonProps) {
	return (
		<ToolButton
			imagePath={Brush3D}
			toolAlt="3D Brush"
			toolFunc={onClick}
			selected={selected}
		/>
	);
}
