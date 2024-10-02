import { InnerItemContainer } from "./InnerItemContainer";

interface LabelItemProps {
	name: string;
	color: string;
}

export function LabelItem({ name, color }: LabelItemProps) {
	const labelCircleStyles = {
		backgroundColor: color,
	};

	return (
		<InnerItemContainer>
			<li className="m-1 flex gap-4 p-2">
				<div
					className={`h-6 w-6 rounded-full`}
					style={labelCircleStyles}
				></div>
				<p>{name}</p>
			</li>
		</InnerItemContainer>
	);
}
