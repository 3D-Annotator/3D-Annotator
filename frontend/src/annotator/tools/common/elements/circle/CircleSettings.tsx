import { useI18nContext } from "i18n/i18n-react";
import { PercentInput } from "../../components/PercentInput";
import { Circle } from "./Circle";

/**
 * An object to store general props for a sphere
 */
interface Props {
	params: { size: number };
}

const PERCENT_FACTOR = 100;

/**
 * A component to change the Sphere radius in the UI
 *
 * @param param0 an object that stores the sphere props
 * @returns the component
 */
export function CircleSettings({ params }: Props) {
	const { LL } = useI18nContext();
	return (
		<PercentInput
			label={LL.SIZE() + ":"}
			onChange={(size) => {
				params.size = size / PERCENT_FACTOR;
			}}
			min={Circle.MIN_SCALE * PERCENT_FACTOR}
			max={Circle.MAX_SCALE * PERCENT_FACTOR}
			defaultValue={params.size * PERCENT_FACTOR}
		/>
	);
}
