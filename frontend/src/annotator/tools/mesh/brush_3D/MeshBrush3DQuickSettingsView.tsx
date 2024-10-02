import { type ToolQuickSettingsProps } from "~annotator/tools/Tool";
import { SphereSettings } from "~annotator/tools/common/elements/sphere/SphereSettings";
import { type MeshBrush3D } from "./MeshBrush3D";

/**
 * The button component to access the quick setting oft the MeshBrush
 *
 * @param props the component props
 * @returns the settings component
 */
export function MeshBrush3DQuickSettingsView(props: ToolQuickSettingsProps) {
	const tool = props.tool as MeshBrush3D;
	return <SphereSettings params={tool.parameters} />;
}
