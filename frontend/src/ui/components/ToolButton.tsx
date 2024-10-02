interface ToolButtonProps {
	imagePath: string;
	toolFunc: () => void;
	toolAlt?: string;
	selected?: boolean;
	disabled?: boolean;
}

export function ToolButton({
	imagePath,
	toolFunc,
	toolAlt = "",
	selected,
	disabled,
}: ToolButtonProps) {
	return (
		<div className="tooltip tooltip-right h-16 w-16" data-tip={toolAlt}>
			<button
				className={`btn btn-primary m-1 h-14 w-14 ${
					selected && "btn-info"
				}`}
				onClick={toolFunc}
				disabled={disabled}
			>
				<img
					src={imagePath}
					alt={toolAlt}
					className={disabled ? "opacity-25" : ""}
				/>
			</button>
		</div>
	);
}
