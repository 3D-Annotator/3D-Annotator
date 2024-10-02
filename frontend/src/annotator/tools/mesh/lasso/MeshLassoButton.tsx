import { useI18nContext } from "i18n/i18n-react";
import { type ToolButtonProps } from "~annotator/tools/Tool";
import { ToolButton } from "~ui/components/ToolButton";
import Lasso from "./lasso.png";

/**
 * The button component to select the LassoTool
 *
 * @param props the component props
 * @returns the button component
 */
export function MeshLassoButton({ onClick, selected }: ToolButtonProps) {
	const { LL } = useI18nContext();
	return (
		<ToolButton
			imagePath={Lasso}
			toolAlt={LL.LASSO()}
			toolFunc={onClick}
			selected={selected}
		/>
	);
}
