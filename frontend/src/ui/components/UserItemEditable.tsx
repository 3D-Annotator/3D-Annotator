import { useI18nContext } from "i18n/i18n-react";
import Delete from "~assets/icons/delete.png";
import { type User } from "~entity/User";
import { StandardContainer } from "./StandardContainer";

interface UserItemEditableProps {
	user: User;
	removeUser(id: number): void;
}

export function UserItemEditable({ user, removeUser }: UserItemEditableProps) {
	function onDelete() {
		removeUser(user.id);
	}

	const { LL } = useI18nContext();
	return (
		<StandardContainer>
			<li className="m-1 flex gap-2 p-2">
				<p className="ml-2">{user.username}</p>
				<img
					className="my-auto mr-2 h-3 w-3 cursor-pointer object-scale-down"
					src={Delete}
					alt={LL.DELETE()}
					onClick={onDelete}
				/>
			</li>
		</StandardContainer>
	);
}
