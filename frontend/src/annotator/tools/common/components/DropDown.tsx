/**
 * This props object contains all props generally used by an tool
 */
interface Props<T> {
	label: string;
	onChange: (n: T) => void;
	defaultValue?: string;
	// title, value, tool tip (optional)
	choices: [[string, T, string]];
}

/**
 * A component to change to tool size in the UI
 *
 * @param param0 an object containing all {@link Props} for an tool
 * @returns
 */
export function DropDown<T>({
	label,
	onChange,
	defaultValue,
	choices,
}: Props<T>) {
	const selectedColor = "btn-info";
	const defaultChoiceIndex = choices.findIndex((choice) => {
		return choice[1] === defaultValue;
	});
	let selected = defaultChoiceIndex;
	return (
		<div className="mx-1 my-auto flex gap-2">
			<div className="dropdown-hover dropdown">
				<label tabIndex={0} className="btn btn-primary m-1">
					{label}
				</label>
				<ul
					tabIndex={0}
					className="dropdown-content menu rounded-box w-52 bg-base-100 p-2 shadow"
				>
					{choices.map((choice, index) => (
						<li
							key={index}
							className={"tooltip tooltip-right"}
							data-tip={choice[2]}
						>
							<button
								className={
									"flex w-full" +
									(index === defaultChoiceIndex
										? " " + selectedColor
										: "")
								}
								onClick={(e) => {
									const button = e.currentTarget;
									const parentUl =
										button.parentElement!.parentElement!;

									const oldButton =
										parentUl.children.item(
											selected
										)?.firstElementChild;
									if (oldButton) {
										oldButton.classList.remove(
											selectedColor
										);
									}
									selected = index;
									button.classList.add(selectedColor);
									onChange(choice[1]);
								}}
							>
								{choice[0]}
							</button>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
