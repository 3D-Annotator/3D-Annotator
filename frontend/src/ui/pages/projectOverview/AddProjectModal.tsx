import { useI18nContext } from "i18n/i18n-react";
import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAPI } from "../../contexts/APIContext";

export function AddProjectModal() {
	const { LL } = useI18nContext();
	const navigate = useNavigate();
	const api = useAPI();

	const nameRef = useRef<HTMLInputElement>(null);
	const descriptionRef = useRef<HTMLInputElement>(null);
	const [formEmpty, setFormEmpty] = useState(false);

	function submit(submitEvent: FormEvent) {
		submitEvent.preventDefault();
		const name = nameRef.current?.value;
		const description = descriptionRef.current?.value;
		if (name && description) {
			setFormEmpty(false);
			api.projects.add({ name, description }).match(
				(project) => {
					navigate(`/project/${project.id}`);
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
				htmlFor="label-modal"
				className="modal-button btn btn-secondary w-full normal-case"
			>
				{"+ " + LL.ADD_PROJECT()}
			</label>
			<input type="checkbox" id="label-modal" className="modal-toggle " />

			<div className="modal">
				<div className="modal-box relative">
					<label
						htmlFor="label-modal"
						className="btn btn-circle btn-sm absolute right-4 top-4"
					>
						✕
					</label>
					<div className="my-auto space-y-4">
						<h2 className="text-xl">{LL.ADD_PROJECT()}</h2>

						<div>
							<form onSubmit={submit}>
								<label htmlFor="name" className="label">
									<span className="label-text">
										{LL.NAME()}
									</span>
								</label>
								<input
									type="text"
									placeholder={LL.NAME()}
									id="name"
									className={`input input-bordered w-full`}
									maxLength={100}
									ref={nameRef}
								/>
								<label htmlFor="description" className="label">
									<span className="label-text">
										{LL.DESCRIPTION()}
									</span>
								</label>
								<input
									placeholder={LL.DESCRIPTION()}
									id="description"
									className={`textarea textarea-bordered w-full `}
									maxLength={255}
									ref={descriptionRef}
								/>
								{formEmpty && (
									<p className="-mb-4 text-error">
										{LL.FILL_ALL_FIELDS()}
									</p>
								)}

								<button
									type="submit"
									className="btn btn-block mt-6 bg-primary normal-case"
								>
									{LL.ADD_PROJECT()}
								</button>
							</form>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
