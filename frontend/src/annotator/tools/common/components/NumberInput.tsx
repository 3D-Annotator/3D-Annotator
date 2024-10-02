import { useState } from "react";

/**
 * This props object contains all props generally used by an tool
 */
export interface NumberInputProps {
	label: string;
	onChange: (n: number) => void;
	min?: number;
	max?: number;
	defaultValue?: number;
	step?: number;
	tooltip?: string;
}

/**
 * A component to change to tool size in the UI
 *
 * @param param0 an object containing all {@link NumberInputProps} for an tool
 * @returns
 */
export function NumberInput({
	label,
	onChange,
	defaultValue,
	step,
	min,
	max,
	tooltip = "",
}: NumberInputProps) {
	const [value, setValue] = useState(
		defaultValue ? String(defaultValue) : ""
	);

	function updateValue(size: string) {
		setValue(size);
		onChange(+size);
	}

	const hasTip = tooltip !== "";
	return (
		<div className="my-auto ml-4 flex gap-2">
			<p
				className={
					"my-auto text-lg text-white" +
					(hasTip ? " tooltip tooltip-bottom" : "")
				}
				data-tip={tooltip}
			>
				{label}
			</p>
			<input
				value={value}
				onChange={(e) => {
					updateValue(e.target.value);
				}}
				onBlur={(e) => {
					const value = getValueInBounds(+e.target.value, min, max);
					updateValue(String(value));
				}}
				type="number"
				min={min}
				step={step}
				max={max}
				className="input input-bordered w-24"
			/>
		</div>
	);
}

/**
 * Transforms the user input value to a value in bounds.
 *
 * @param value the user input
 * @param min the min value
 * @param max the max value
 * @returns the value in bounds
 */
function getValueInBounds(value: number, min?: number, max?: number) {
	let newValue = value;
	if (min && value < min) {
		newValue = min;
	} else if (max && value > max) {
		newValue = max;
	}
	return newValue;
}
