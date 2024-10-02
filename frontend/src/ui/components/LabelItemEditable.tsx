import { type Label } from "~entity/Annotation";
import { StandardContainer } from "./StandardContainer";

interface LabelItemEditableProps {
	label: Label;
	deleteLabel(id: number): void;
}

export function LabelItemEditable({
	label,
	deleteLabel,
}: LabelItemEditableProps) {
	const labelCircleStyles = {
		backgroundColor: label.color.asHTMLCode(),
	};

	function onDelete() {
		deleteLabel(label.id);
	}

	return (
		<StandardContainer>
			<li className="m-1 flex gap-4 p-2">
				<div
					className={`h-6 w-6 rounded-full`}
					style={labelCircleStyles}
				></div>
				<p>{label.name}</p>
				<p>({label.annotationClass})</p>
				<button className="mr-2 cursor-pointer" onClick={onDelete}>
					✕
				</button>
			</li>
		</StandardContainer>
	);
}
