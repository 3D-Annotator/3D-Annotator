import { useI18nContext } from "i18n/i18n-react";
import type { ToolButtonProps } from "~annotator/tools/Tool";
import { ToolButton } from "~ui/components/ToolButton";
import Polygon from "./polygon.png";

/**
 * The button component to select the LassoTool
 *
 * @param props the component props
 * @returns the button component
 */
export function MeshPolygonButton({ onClick, selected }: ToolButtonProps) {
	const { LL } = useI18nContext();
	return (
		<ToolButton
			imagePath={Polygon}
			toolAlt={LL.POLYGON()}
			toolFunc={onClick}
			selected={selected}
		/>
	);
}
