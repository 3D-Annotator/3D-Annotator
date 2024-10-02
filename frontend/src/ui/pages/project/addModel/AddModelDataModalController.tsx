import { getI18NContext } from "i18n/vanilla-context";
import { useState } from "react";
import { toast } from "react-toastify";
import { Errors } from "~api/Errors";
import { ModelType } from "~entity/ModelInformation";
import { ElementList } from "~ui/components/ElementList";
import { useAPI } from "~ui/contexts/APIContext";
import { ModelDataPreviewItem } from "~ui/pages/project/addModel/ModelDataPreviewItem";
import { fileExtension, fileName } from "~util/FileUtils";
import { assertUnreachable } from "~util/TypeScript";
import { useProjectPageStore } from "../ProjectPage";

interface AddModelDataModalProps {
	projectId: number;
}
export interface ModelDataPreview {
	key: number;
	name: string;
	modelFile: File;
	textureFile?: File;
	annotationFile?: File;
}

const LL = getI18NContext();

const NO_MODEL_DATA_PREVIEWS_MSG = LL.NO_MODEL_DATA_PREVIEWS_MSG();
const NO_MODEL_TYPE_MSG = LL.NO_MODEL_TYPE_MSG();
const UNNAMED_MODEL_DATA_PREVIEW_MSG = LL.UNNAMED_MODEL_DATA_PREVIEW_MSG();

export function AddModelDataModalController({
	projectId,
}: AddModelDataModalProps) {
	const api = useAPI();

	const setLoading = useProjectPageStore((state) => state.setLoading);

	const [modalOpen, setModalOpen] = useState(false);
	const [modelType, setModelType] = useState<ModelType>();
	const [modelDataPreviews, setModelDataPreviews] = useState<
		ModelDataPreview[]
	>([]);
	const [error, setError] = useState({ error: false, message: "" });

	async function addModelData(
		name: string,
		modelType: ModelType,
		modelFile: File,
		textureFile?: File,
		annotationFile?: File
	) {
		const modelsRes = await api.models.add({
			name: name,
			modelType: modelType,
			projectId: projectId,
		});

		if (modelsRes.isErr()) {
			return Promise.reject();
		}

		const modelInformation = modelsRes.value;
		const fileStreams = [
			{ stream: modelFile.stream(), name: modelFile.name },
		];
		if (textureFile) {
			fileStreams.push({
				stream: textureFile.stream(),
				name: textureFile.name,
			});
		}

		const id = toast.info(LL.COMPRESSING(), {
			isLoading: true,
		});

		const filesRes = await api.files.uploadModel(
			modelInformation.id,
			fileStreams,
			(n) => {
				toast.update(id, {
					progress: n / 100,
					isLoading: false,
					render: LL.UPLOADING(),
				});
			}
		);

		if (filesRes.isErr()) {
			const error = filesRes.error;

			switch (error.code) {
				case Errors.NETWORK:
					break;
				case Errors.LARGE_FILE:
					toast.update(id, {
						progress: 0,
						hideProgressBar: true,
						isLoading: false,
						autoClose: 5000,
						type: "error",
						render: LL.ANNOTATION_FILE_TOO_BIG(),
					});
					console.log("large file");
					break;
				case Errors.EXISTING_BASE_FILE:
					toast.update(id, {
						progress: 0,
						hideProgressBar: true,
						isLoading: false,
						autoClose: 5000,
						type: "error",
						render: LL.BASE_FILE_ALREADY_EXISTS(),
					});
					console.log("existing base file");
					break;

				default:
					assertUnreachable(error.code);
			}

			return Promise.reject(filesRes.error);
		}

		if (annotationFile) {
			const fileRes = await api.files.uploadAnnotationFile(
				modelInformation.id,
				annotationFile.stream(),
				(n) => {
					toast.update(id, {
						progress: n / 100,
						isLoading: false,
						render: LL.UPLOADING(),
					});
				}
			);

			if (fileRes.isErr()) {
				const error = fileRes.error;

				switch (error.code) {
					case Errors.NETWORK:
						break;
					case Errors.LARGE_FILE:
						toast.update(id, {
							progress: 0,
							hideProgressBar: true,
							isLoading: false,
							autoClose: 5000,
							type: "error",
							render: LL.ANNOTATION_FILE_TOO_BIG(),
						});
						console.log("large file");
						break;
					case Errors.LOCKED:
						toast.update(id, {
							progress: 0,
							hideProgressBar: true,
							isLoading: false,
							autoClose: 5000,
							type: "error",
							render: LL.MODEL_LOCKED(),
						});
						console.log("model locked");
						break;
					default:
						assertUnreachable(error.code);
				}

				return Promise.reject(fileRes.error);
			}
		}

		toast.update(id, {
			progress: 0,
			hideProgressBar: true,
			isLoading: false,
			autoClose: 3000,
			type: "success",
			render: LL.UPLOAD_SUCCESS(),
		});

		setLoading(true);
		return Promise.resolve(modelInformation);
	}

	const filePickerOpts = {
		types: [
			{
				description: "3D-Modell",
				accept: {
					"*/*": [
						".obj" as const,
						".OBJ" as const,
						".ply" as const,
						".PLY" as const,
						".jpeg" as const,
						".JPEG" as const,
						".jpg" as const,
						".JPG" as const,
						".txt" as const,
						".TXT" as const,
						".anno3d" as const,
						".ANNO3D" as const,
					],
				},
			},
		],
		excludeAcceptAllOption: true,
		multiple: true,
	};

	async function onFilesSelect() {
		try {
			const filesHandle = await window.showOpenFilePicker(filePickerOpts);

			const files: File[] = [];

			for await (const [, value] of filesHandle.entries()) {
				files.push(await value.getFile());
			}

			setSelectedFiles(files);
		} catch {
			//Throws Exception when file picker is closed
		}
	}

	async function onFolderSelect() {
		try {
			const folderHandle = await window.showDirectoryPicker();

			const files: File[] = [];

			for await (const [, value] of folderHandle.entries()) {
				if (value.kind === "file") files.push(await value.getFile());
			}
			setSelectedFiles(files);
		} catch {
			//Throws Exception when file picker is closed
		}
	}

	function setSelectedFiles(files: File[]) {
		const tempModelDataPreviews: ModelDataPreview[] = [];
		const modelFiles: File[] = [];
		const textureFiles: File[] = [];
		const annotationFiles: File[] = [];

		const modelFileRegEx = new RegExp("(obj)|(OBJ)|(ply)|(PLY)");
		const textureFileRegEx = new RegExp("(jpeg)|(JPEG)|(jpg)|(JPG)");
		const annotationFileRegEx = new RegExp("(txt)|(TXT)|(anno3d)|(ANNO3D)");

		for (const file of files) {
			const extension = fileExtension(file);

			if (extension === "") continue;
			else if (modelFileRegEx.test(extension)) {
				//modelFile
				modelFiles.push(file);
			} else if (textureFileRegEx.test(extension)) {
				//textureFile
				textureFiles.push(file);
			} else if (annotationFileRegEx.test(extension)) {
				//annotationFile
				annotationFiles.push(file);
			}
		}

		for (const [index, modelFile] of modelFiles.entries()) {
			const modelFileName = fileName(modelFile.name);
			const textureFile = textureFiles.find((file) =>
				fileName(file.name).includes(modelFileName)
			);

			const annotationFile = annotationFiles.find((file) =>
				fileName(file.name).includes(modelFileName)
			);

			tempModelDataPreviews.push({
				key: index,
				name: modelFileName,
				modelFile: modelFile,
				textureFile: textureFile,
				annotationFile: annotationFile,
			});
		}

		setModelDataPreviews(tempModelDataPreviews);
	}

	function changeName(id: number, name: string) {
		const tempModelDataPreviews = [...modelDataPreviews];
		if (tempModelDataPreviews && id < tempModelDataPreviews.length) {
			tempModelDataPreviews[id] = {
				...tempModelDataPreviews[id],
				name: name,
			};

			setModelDataPreviews(tempModelDataPreviews);
		}
	}

	function changeModelFile(id: number, file: File) {
		const tempModelDataPreviews = [...modelDataPreviews];
		if (tempModelDataPreviews && id < tempModelDataPreviews.length) {
			tempModelDataPreviews[id] = {
				...tempModelDataPreviews[id],
				modelFile: file,
			};

			setModelDataPreviews(tempModelDataPreviews);
		}
	}

	function changeTextureFile(id: number, file: File | undefined) {
		const tempModelDataPreviews = [...modelDataPreviews];
		if (tempModelDataPreviews && id < tempModelDataPreviews.length) {
			tempModelDataPreviews[id] = {
				...tempModelDataPreviews[id],
				textureFile: file,
			};

			setModelDataPreviews(tempModelDataPreviews);
		}
	}

	function changeAnnotationFile(id: number, file: File | undefined) {
		const tempModelDataPreviews = [...modelDataPreviews];
		if (tempModelDataPreviews && id < tempModelDataPreviews.length) {
			tempModelDataPreviews[id] = {
				...tempModelDataPreviews[id],
				annotationFile: file,
			};

			setModelDataPreviews(tempModelDataPreviews);
		}
	}

	function removeModelDataPreview(id: number) {
		const tempModelDataPreviews = [...modelDataPreviews];
		tempModelDataPreviews.splice(id, 1);
		setModelDataPreviews(tempModelDataPreviews);
	}

	function getModelDataPreviewItems(): JSX.Element[] {
		const previewItems: JSX.Element[] = [];
		if (!modelDataPreviews) {
			return [];
		}

		for (const preview of modelDataPreviews) {
			previewItems.push(
				<ModelDataPreviewItem
					key={preview.key}
					name={preview.name}
					id={previewItems.length}
					modelFile={preview.modelFile}
					textureFile={
						preview.textureFile ? preview.textureFile : undefined
					}
					annotationFile={
						preview.annotationFile
							? preview.annotationFile
							: undefined
					}
					changeName={changeName}
					changeModelFile={changeModelFile}
					changeTextureFile={changeTextureFile}
					changeAnnotationFile={changeAnnotationFile}
					removePreviewItem={removeModelDataPreview}
					modelType={modelType}
				/>
			);
		}
		return previewItems;
	}

	function upload() {
		setError({ error: false, message: "" });
		if (modelDataPreviews.length === 0) {
			setError({ error: true, message: NO_MODEL_DATA_PREVIEWS_MSG });
			return;
		}

		if (!modelType) {
			setError({ error: true, message: NO_MODEL_TYPE_MSG });
			return;
		}

		for (const preview of modelDataPreviews) {
			if (!preview.name) {
				setError({
					error: true,
					message: UNNAMED_MODEL_DATA_PREVIEW_MSG,
				});
				return;
			}
		}

		modelDataPreviews.forEach((preview) => {
			const textureFile =
				modelType === ModelType.MESH ? preview.textureFile : undefined;

			addModelData(
				preview.name,
				modelType,
				preview.modelFile,
				textureFile,
				preview.annotationFile
			);
		});

		setModelDataPreviews([]);
	}

	return (
		<div className="flex flex-col gap-y-4">
			<>
				<label
					htmlFor="add-model-modal"
					className="modal-button btn btn-primary w-full normal-case"
					onClick={() => {
						setModalOpen(true);
					}}
				>
					{LL.UPLOAD_MODELS()}
				</label>
				<input
					type="checkbox"
					id="add-model-modal"
					className="modal-toggle "
					checked={modalOpen}
					onChange={() => {
						setModalOpen(modalOpen);
					}}
				/>

				<div className="modal px-80 py-20">
					<div className="modal-box max-h-full min-w-full max-w-fit">
						<label
							htmlFor="add-model-modal"
							className="btn btn-circle btn-sm absolute right-4 top-4"
							onClick={() => {
								setModalOpen(false);
							}}
						>
							✕
						</label>
						<div className="my-auto space-y-4">
							<h2 className="text-xl">{LL.UPLOAD_MODELS()}</h2>
						</div>

						<form
							onSubmit={(submitEvent: React.FormEvent) => {
								submitEvent.preventDefault();
								upload();
							}}
						>
							<div className="divider"></div>

							<div className="form-control mt-4">
								<label className="label cursor-pointer">
									<span className="label-text">
										{LL.TRIANGLE_MESH()}
									</span>
									<input
										type="radio"
										name="mesh"
										className="checked:primary radio"
										checked={modelType === ModelType.MESH}
										onChange={() => {
											setModelType(ModelType.MESH);
										}}
									/>
								</label>
							</div>
							<div className="form-control">
								<label className="label cursor-pointer">
									<span className="label-text">
										{LL.POINT_CLOUD()}
									</span>
									<input
										type="radio"
										name="point-cloud"
										className="checked:primary radio"
										checked={
											modelType === ModelType.POINT_CLOUD
										}
										onChange={() => {
											setModelType(ModelType.POINT_CLOUD);
										}}
									/>
								</label>
							</div>

							<div className="mt-4 grid grid-cols-2 gap-4">
								<button
									type="button"
									className=" btn btn-primary w-full normal-case"
									onClick={() => {
										onFolderSelect();
									}}
								>
									{LL.SELECT_DIRECTORY()}
								</button>
								<button
									type="button"
									className=" btn btn-primary w-full normal-case "
									onClick={() => {
										onFilesSelect();
									}}
								>
									{LL.SELECT_FILES()}
								</button>
							</div>

							{modelDataPreviews && (
								<div>
									<ElementList
										items={getModelDataPreviewItems()}
									/>
								</div>
							)}

							<div className="mt-8">
								{error.error && (
									<p className="text-error">
										{error.message}
									</p>
								)}
								<button
									type="submit"
									className="btn btn-primary btn-block normal-case"
								>
									{LL.UPLOAD_MODELS()}
								</button>
							</div>
						</form>
					</div>
				</div>
			</>
		</div>
	);
}
