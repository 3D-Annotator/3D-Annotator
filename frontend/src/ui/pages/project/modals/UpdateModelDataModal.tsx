import { useI18nContext } from "i18n/i18n-react";
import { useRef, useState } from "react";
import { useAPI } from "~ui/contexts/APIContext";
import { useProjectPageStore } from "~ui/pages/project/ProjectPage";
import { useUpdateAnnotationFile } from "~ui/pages/project/UpdateAnnotationFile";

interface UpdateModelDataModalProps {
	name: string;
	id: number;
}

export function UpdateModelDataModal({ id, name }: UpdateModelDataModalProps) {
	const { LL } = useI18nContext();
	const api = useAPI();
	const setLoading = useProjectPageStore((state) => state.setLoading);
	const updateAnnotationFile = useUpdateAnnotationFile();

	const nameRef = useRef<HTMLInputElement>(null);
	const annotationFileRef = useRef<HTMLInputElement>(null);
	const [formEmpty, setFormEmpty] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);

	function updateModelData(id: number, name: string) {
		api.models.update(id, name);
		setLoading(true);
	}

	function submit(submitEvent: React.FormEvent) {
		submitEvent.preventDefault();
		const name = nameRef.current?.value;

		if (name) {
			setFormEmpty(false);
			updateModelData(id, name);
			setModalOpen(false);
		} else {
			setFormEmpty(true);
		}
	}

	function update(submitEvent: React.FormEvent) {
		submitEvent.preventDefault();
		const annotationFile = annotationFileRef.current?.files;

		if (annotationFile) {
			setFormEmpty(false);
			updateAnnotationFile(id, annotationFile[0]);
			setModalOpen(false);
		} else {
			setFormEmpty(true);
		}
	}

	return (
		<>
			<label
				htmlFor="update-model-modal"
				className="modal-button btn btn-primary ml-auto normal-case"
				onClick={() => {
					setModalOpen(true);
				}}
			>
				{LL.EDIT()}
			</label>
			<input
				type="checkbox"
				id="update-model-modal"
				className="modal-toggle "
				checked={modalOpen}
				onChange={() => {
					setModalOpen(modalOpen);
				}}
			/>

			<div className="modal">
				<div className="modal-box relative">
					<label
						htmlFor="update-model-modal"
						className="btn btn-circle btn-sm absolute right-4 top-4"
						onClick={() => {
							setModalOpen(false);
						}}
					>
						✕
					</label>
					<div className="my-auto space-y-4">
						<h2 className="text-xl">{LL.EDIT_MODEL()}</h2>
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
							defaultValue={name}
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
							{LL.EDIT_MODEL()}
						</button>
					</form>
					<form onSubmit={update}>
						<label htmlFor="annotation-file" className="label mt-2">
							<span className="label-text">
								{LL.ANNOTATION_FILE()}
							</span>
						</label>

						<input
							type="file"
							placeholder={LL.ANNOTATION_FILE()}
							id="annotation-file"
							className={`file:btn file:mr-4`}
							accept=".anno3d, .txt"
							ref={annotationFileRef}
						/>

						<button
							type="submit"
							className="btn btn-primary btn-block mt-6 normal-case"
						>
							{LL.UPLOAD_ANNOTATION_FILE()}
						</button>
					</form>
				</div>
			</div>
		</>
	);
}
