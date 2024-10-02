import { InnerItemContainer } from "./InnerItemContainer";

interface UserItemProps {
	name: string;
}

export function UserItem({ name }: UserItemProps) {
	return (
		<InnerItemContainer>
			<li className="m-1 flex gap-2 p-2">
				<p className="mx-2">{name}</p>
			</li>
		</InnerItemContainer>
	);
}
