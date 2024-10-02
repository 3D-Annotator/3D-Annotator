/**
 * This props object contains all props generally used by a tool
 */
interface Props {
	children: string;
	onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
	toolTip: string;
	disabled?: boolean;
}

/**
 * A component to toggle a function of the tool in the UI.
 *
 * @param param0 an object containing all {@link Props} for an tool
 * @returns
 */
export function Button({
	onClick,
	toolTip,
	children,
	disabled = false,
}: Props) {
	return (
		<div
			className="tooltip tooltip-bottom mx-1 my-auto flex"
			data-tip={toolTip}
		>
			<button
				disabled={disabled}
				className={"btn btn-primary"}
				onClick={(e) => {
					onClick(e);
				}}
			>
				{children}
			</button>
		</div>
	);
}
