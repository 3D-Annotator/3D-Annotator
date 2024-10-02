import { useState } from "react";
import { NumberInput, type NumberInputProps } from "./NumberInput";

type Props = Omit<NumberInputProps, "step">;

export function PercentInput({ onChange, defaultValue, ...props }: Props) {
	const [number, setNumber] = useState(defaultValue);

	function onChangeIntercept(n: number) {
		setNumber(n);
		onChange(n);
	}

	return (
		<NumberInput
			{...props}
			defaultValue={defaultValue}
			onChange={onChangeIntercept}
			step={numberToStep(number)}
		/>
	);
}

function numberToStep(n: number | undefined, magnitude = 1) {
	if (n === undefined) {
		return 1;
	}

	return Math.pow(10, Math.ceil(Math.log10(n) - magnitude));
}
