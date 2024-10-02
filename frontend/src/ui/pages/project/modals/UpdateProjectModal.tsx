import { useI18nContext } from "i18n/i18n-react";
import { useRef, useState } from "react";
import { type Project } from "~entity/Project";
import { useAPI } from "../../../contexts/APIContext";
import { useProjectPageStore } from "../ProjectPage";

interface UpdateProjectModalControllerProps {
	setLoading(newState: boolean): void;
	project: Project;
}

export interface UpdateProjectModalProps {
	project: Project;
}

export function UpdateProjectModal({
	project,
}: UpdateProjectModalControllerProps) {
	const { LL } = useI18nContext();
	const api = useAPI();
	const setLoading = useProjectPageStore((state) => state.setLoading);

	const nameRef = useRef<HTMLInputElement>(null);
	const descriptionRef = useRef<HTMLInputElement>(null);
	const [formEmpty, setFormEmpty] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);

	function submit(submitEvent: React.FormEvent) {
		submitEvent.preventDefault();
		const name = nameRef.current?.value;
		const description = descriptionRef.current?.value;
		if (name && description) {
			setFormEmpty(false);
			api.projects.update(project.id, {
				...project,
				name: name,
				description: description,
			});
			setLoading(true);
			setModalOpen(false);
		} else {
			setFormEmpty(true);
		}
	}

	return (
		<>
			<label
				htmlFor="update-project-modal"
				className="modal-button btn btn-primary w-full normal-case"
				onClick={() => {
					setModalOpen(true);
				}}
			>
				{LL.EDIT_PROJECT()}
			</label>
			<input
				type="checkbox"
				id="update-project-modal"
				className="modal-toggle "
				checked={modalOpen}
				onChange={() => {
					setModalOpen(modalOpen);
				}}
			/>

			<div className="modal">
				<div className="modal-box relative">
					<label
						htmlFor="update-project-modal"
						className="btn btn-circle btn-sm absolute right-4 top-4"
						onClick={() => {
							setModalOpen(false);
						}}
					>
						✕
					</label>
					<div className="my-auto space-y-4">
						<h2 className="text-xl">{LL.EDIT_PROJECT()}</h2>
					</div>
					<form onSubmit={submit}>
						<label htmlFor="name" className="label">
							<span className="label-text">{LL.NAME()}</span>
						</label>
						<input
							type="text"
							placeholder={LL.NAME()}
							id="name"
							className={`input input-bordered w-full`}
							maxLength={100}
							ref={nameRef}
							defaultValue={project?.name}
						/>
						<label htmlFor="description" className="label">
							<span className="label-text">
								{LL.DESCRIPTION()}
							</span>
						</label>
						<input
							type="text"
							placeholder={LL.DESCRIPTION()}
							id="description"
							className={`textarea textarea-bordered w-full `}
							maxLength={255}
							ref={descriptionRef}
							defaultValue={project?.description}
						/>
						{formEmpty && (
							<p className="-mb-4 text-error">
								{LL.FILL_ALL_FIELDS()}
							</p>
						)}

						<button
							type="submit"
							className="btn btn-primary btn-block mt-6 normal-case"
						>
							{LL.EDIT_PROJECT()}
						</button>
					</form>
				</div>
			</div>
		</>
	);
}
