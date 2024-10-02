import { useI18nContext } from "i18n/i18n-react";
import { useRef, useState, type FormEvent } from "react";
import {
	Color,
	MAX_ANNOTATION_CLASS,
	MIN_ANNOTATION_CLASS,
	type Label,
} from "~entity/Annotation";
import { type Project } from "~entity/Project";
import { LabelItemEditable } from "~ui/components/LabelItemEditable";
import { useAPI } from "../../../contexts/APIContext";
import { useProjectPageStore } from "../ProjectPage";

interface LabelModalControllerProps {
	project?: Project;
}

export function LabelModal({ project }: LabelModalControllerProps) {
	const { LL } = useI18nContext();
	const api = useAPI();
	const setLoading = useProjectPageStore((state) => state.setLoading);
	const nameRef = useRef<HTMLInputElement>(null);
	const colorRef = useRef<HTMLInputElement>(null);
	const annotationClassRef = useRef<HTMLInputElement>(null);
	const [formEmpty, setFormEmpty] = useState(false);

	let labels: Label[] = [];
	const [annotationClassUsed, setAnnotationClassUsed] = useState(false);

	if (project?.labels) {
		labels = project.labels;
	}

	let labelItemList: JSX.Element[] = [];
	if (labels) {
		labelItemList = labels.map((element) => (
			<LabelItemEditable
				deleteLabel={deleteLabel}
				label={element}
				key={element.id}
			/>
		));
	}

	function addLabel(name: string, color: string, annotationClass: number) {
		const colorRGB = Color.fromHTMLCode(color);
		api.labels
			.add({
				projectId: project ? project.id : 0,
				name: name,
				color: colorRGB,
				annotationClass: annotationClass,
			})
			.match(
				() => {
					setAnnotationClassUsed(false);
					setLoading(true);
				},
				() => {
					setAnnotationClassUsed(true);
					setLoading(true);
				}
			);
	}

	function deleteLabel(id: number) {
		api.labels.delete(id).match(
			() => {
				setLoading(true);
			},
			() => {
				// nothing to do
			}
		);
	}

	function submit(submitEvent: FormEvent) {
		submitEvent.preventDefault();
		const name = nameRef.current?.value;
		const color = colorRef.current?.value;
		const annotationClass = annotationClassRef.current?.value;
		if (name && color && annotationClass) {
			setFormEmpty(false);
			addLabel(name, color, +annotationClass);
		} else {
			setFormEmpty(true);
		}
	}

	return (
		<>
			<label
				htmlFor="label-modal"
				className="modal-button btn btn-primary w-full normal-case"
			>
				{LL.EDIT_LABELS()}
			</label>
			<input type="checkbox" id="label-modal" className="modal-toggle" />

			<div className="modal">
				<div className="modal-box relative max-w-screen-lg">
					<label
						htmlFor="label-modal"
						className="btn btn-circle btn-sm absolute right-4 top-4"
					>
						✕
					</label>
					<div className="my-auto space-y-4">
						<h2 className="text-xl">{LL.LABELS()}</h2>

						<ul className="flex flex-wrap gap-2">
							{labelItemList}
						</ul>
					</div>
					<div className="divider"></div>
					<div>
						<h2 className="mb-4 text-xl">{LL.NEW_LABEL()}</h2>
						<form onSubmit={submit} className="flex flex-row gap-2">
							<input
								type="text"
								id="name"
								className="input input-bordered"
								placeholder={LL.NAME()}
								ref={nameRef}
							/>
							<input
								type="color"
								id="color"
								className="w-15 input input-bordered p-1"
								placeholder={LL.COLOR()}
								ref={colorRef}
							/>
							<input
								type="number"
								id="annotation-class"
								className={`input input-bordered ${
									annotationClassUsed && "input-error"
								}`}
								placeholder={LL.ANNOTATION_CLASS()}
								ref={annotationClassRef}
								min={MIN_ANNOTATION_CLASS}
								max={MAX_ANNOTATION_CLASS}
							/>
							<label
								htmlFor="annotation-class"
								className={`label ${
									!annotationClassUsed && "hidden"
								}`}
							>
								<span className="label-text-alt text-error">
									{LL.ANNOTATION_CLASS_ALREADY_EXISTS()}
								</span>
							</label>
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
		</>
	);
}
