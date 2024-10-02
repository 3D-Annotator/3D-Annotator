import { useI18nContext } from "i18n/i18n-react";
import { type ToolButtonProps } from "~annotator/tools/Tool";
import { ToolButton } from "~ui/components/ToolButton";
import Brush3D from "./brush3D.png";

/**
 * The button component to select the MeshBrush
 *
 * @param props the component props
 * @returns the button component
 */
export function MeshBrush3DButton({ onClick, selected }: ToolButtonProps) {
	const { LL } = useI18nContext();

	return (
		<ToolButton
			imagePath={Brush3D}
			toolAlt={LL.BRUSH_3D()}
			toolFunc={onClick}
			selected={selected}
		/>
	);
}
