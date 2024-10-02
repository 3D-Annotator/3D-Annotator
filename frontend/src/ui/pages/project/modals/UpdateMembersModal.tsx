import { useI18nContext } from "i18n/i18n-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { type Project } from "~entity/Project";
import { type User } from "~entity/User";
import { UserItemEditable } from "~ui/components/UserItemEditable";
import { useAPI } from "../../../contexts/APIContext";

interface UserModalControllerProps {
	project?: Project;
	setLoading(newState: boolean): void;
}

export interface UserModalProps {
	userList: User[];
	addUser(id: number): void;
	removeUser(id: number): void;
	allUsers: User[];
}

export function UpdateMembersModal({
	project,
	setLoading,
}: UserModalControllerProps) {
	const { LL } = useI18nContext();
	const api = useAPI();
	const [allUsers, setAllOtherUsers] = useState<User[]>([]);
	const idRef = useRef<HTMLSelectElement>(null);
	const [formEmpty, setFormEmpty] = useState(false);

	function removeUser(id: number) {
		api.projects.removeMember(project ? project.id : 0, id).match(
			() => {
				setLoading(true);
			},
			() => {
				// nothing to do
			}
		);
	}

	useEffect(() => {
		async function getAllOtherUsers() {
			if (!project?.users) {
				return;
			}

			let otherUsers: User[] = [];
			const userIds = project.users.map((user) => user.id);
			const res = await api.users.list();
			if (res.isErr()) {
				return;
			}

			otherUsers = res.value.filter((user) => {
				return !(
					user.id === project.owner.id || userIds.includes(user.id)
				);
			});

			setAllOtherUsers(otherUsers);
		}
		getAllOtherUsers();
	}, [api, project]);

	const userList = project?.users ? project.users : [];
	let userItemList: JSX.Element[] = [];

	if (userList) {
		userItemList = userList.map((element) => (
			<UserItemEditable
				user={element}
				key={element.id}
				removeUser={removeUser}
			/>
		));
	}

	let allUserOptions: JSX.Element[] = [];
	allUserOptions = allUsers.map((user) => {
		return (
			<option key={user.id} value={user.id}>
				{user.username}
			</option>
		);
	});

	function submit(submitEvent: FormEvent) {
		submitEvent.preventDefault();
		const id = idRef.current?.value;
		if (id) {
			setFormEmpty(false);
			api.projects.addMember(project ? project.id : 0, +id).match(
				() => {
					setLoading(true);
				},
				() => {
					// nothing to do
				}
			);
		} else {
			setFormEmpty(true);
		}
	}

	return (
		<>
			<label
				htmlFor="user-modal"
				className="modal-button btn btn-primary w-full normal-case"
			>
				{LL.EDIT_MEMBERS()}
			</label>
			<input type="checkbox" id="user-modal" className="modal-toggle" />

			<div className="modal">
				<div className="modal-box relative max-w-screen-lg">
					<label
						htmlFor="user-modal"
						className="btn btn-circle btn-sm absolute right-4 top-4"
					>
						✕
					</label>
					<div className="my-auto space-y-4">
						<h2 className="text-xl">{LL.MEMBERS()}</h2>

						<ul className="flex flex-wrap gap-2">{userItemList}</ul>
						<div className="divider"></div>
						<div>
							<h2 className="mb-4 text-xl">{LL.ADD_MEMBER()}</h2>
							<form
								onSubmit={submit}
								className="flex flex-row gap-2"
							>
								<select
									ref={idRef}
									className="select select-bordered w-full max-w-xs"
								>
									{allUserOptions}
								</select>

								<button
									type="submit"
									className="btn btn-primary grow normal-case"
								>
									{LL.ADD()}
								</button>
							</form>
							{formEmpty && (
								<p className="mt-4 text-error">
									{LL.FILL_ALL_FIELDS()}
								</p>
							)}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
