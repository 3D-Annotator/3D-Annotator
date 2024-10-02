import { useI18nContext } from "i18n/i18n-react";
import { type ToolQuickSettingsProps } from "~annotator/tools/Tool";
import { RadioButtonGroup } from "~annotator/tools/common/components/RadioButtonGroup";
import { SELECTION_MODES, type MeshLasso } from "./MeshLasso";

/**
 * The component to access the quick setting of the LassoTool
 */
export function MeshLassoQuickSettingsView(props: ToolQuickSettingsProps) {
	const tool = props.tool as MeshLasso;
	const params = tool.parameters;
	const { LL } = useI18nContext();
	return (
		<div className="flex">
			<RadioButtonGroup
				label={LL.SELECTION_MODE() + ":"}
				onChange={(mode) => {
					params.selectionMode = mode;
				}}
				choices={SELECTION_MODES}
				defaultValue={params.selectionMode}
			/>
		</div>
	);
}
