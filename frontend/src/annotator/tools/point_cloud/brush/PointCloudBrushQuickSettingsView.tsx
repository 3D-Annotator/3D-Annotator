import type { ToolQuickSettingsProps } from "~annotator/tools/Tool";
import { CircleSettings } from "~annotator/tools/common/elements/circle/CircleSettings";
import type { PointCloudBrush } from "./PointCloudBrush";

/**
 * The button component to access the quick setting oft the PointBrush
 *
 * @param props the component props
 * @returns the settings component
 */
export function PointCloudBrushQuickSettingsView(
	props: ToolQuickSettingsProps
) {
	const tool = props.tool as PointCloudBrush;
	return <CircleSettings params={tool.params} />;
}
