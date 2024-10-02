/**
 * This props object contains all props generally used by a tool
 */
interface Props {
	label: string;
	onChange: (n: boolean) => void;
	toolTip: string;
	selected: boolean;
}

/**
 * A component to toggle a function of the tool in the UI.
 *
 * @param param0 an object containing all {@link Props} for an tool
 * @returns
 */
export function ToggleButton({ label, onChange, toolTip, selected }: Props) {
	const onColor = "btn-info";
	const offColor = "btn-primary";
	return (
		<div
			className="tooltip tooltip-bottom mx-1 my-auto flex"
			data-tip={toolTip}
		>
			<button
				className={"btn " + (selected ? onColor : offColor)}
				aria-pressed={selected}
				onClick={(e) => {
					// might be better to store the status somewhere else
					const selected = e.currentTarget.ariaPressed === "false";
					e.currentTarget.ariaPressed = "" + selected;
					if (selected) {
						e.currentTarget.classList.remove(offColor);
						e.currentTarget.classList.add(onColor);
					} else {
						e.currentTarget.classList.remove(onColor);
						e.currentTarget.classList.add(offColor);
					}
					onChange(selected);
				}}
			>
				{label}
			</button>
		</div>
	);
}
