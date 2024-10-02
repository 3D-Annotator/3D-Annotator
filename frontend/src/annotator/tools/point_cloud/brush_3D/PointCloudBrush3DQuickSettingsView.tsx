import { type ToolQuickSettingsProps } from "~annotator/tools/Tool";
import { NumberInput } from "~annotator/tools/common/components/NumberInput";
import { SphereSettings } from "~annotator/tools/common/elements/sphere/SphereSettings";
import { type PointCloudBrush3D } from "./PointCloudBrush3D";

/**
 * The button component to access the quick setting oft the PointBrush
 *
 * @param props the component props
 * @returns the settings component
 */
export function PointCloudBrush3DQuickSettingsView(
	props: ToolQuickSettingsProps
) {
	const tool = props.tool as PointCloudBrush3D;
	const parameters = tool.parameters;

	return (
		<div className="flex">
			<SphereSettings params={parameters} />
			<NumberInput
				label="Snap Distance:"
				defaultValue={parameters.raycastThreshold}
				onChange={(n: number) => {
					parameters.raycastThreshold = n;
				}}
				step={0.001}
				min={0.001}
				max={0.5}
				tooltip={"Suchradius um den Zeiger"}
			/>
		</div>
	);
}
