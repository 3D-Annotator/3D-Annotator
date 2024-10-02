import { useI18nContext } from "i18n/i18n-react";
import { useRef, useState } from "react";
import { Delete } from "~assets/icons/Delete";
import { Edit } from "~assets/icons/Edit";
import { ModelType } from "~entity/ModelInformation";
import { StandardContainer } from "~ui/components/StandardContainer";

export interface ModelDataPreviewItemProps {
	name: string;
	id: number;
	modelFile?: File;
	textureFile?: File;
	annotationFile?: File;
	changeName(id: number, name: string): void;
	changeModelFile(id: number, modelFile: File): void;
	changeTextureFile(id: number, textureFile: File | undefined): void;
	changeAnnotationFile(id: number, annotationFile: File | undefined): void;
	removePreviewItem(id: number): void;
	modelType?: ModelType;
}

export function ModelDataPreviewItem(props: ModelDataPreviewItemProps) {
	const [name, setName] = useState(props.name);
	const [modelFile, setModelFile] = useState(props.modelFile);
	const [textureFile, setTextureFile] = useState(props.textureFile);
	const [annotationFile, setAnnotationFile] = useState(props.annotationFile);
	const nameRef = useRef<HTMLInputElement>(null);
	const { LL } = useI18nContext();

	const modelFilePickerOpts = {
		types: [
			{
				description: LL.FILE_DESCRIPTION_3D_MODEL(),
				accept: {
					"*/*": [
						".obj" as const,
						".OBJ" as const,
						".ply" as const,
						".PLY" as const,
					],
				},
			},
		],
		excludeAcceptAllOption: true,
		multiple: false,
	};

	const textureFilePickerOpts = {
		types: [
			{
				description: LL.FILE_DESCRIPTION_TEXTURE(),
				accept: {
					"*/*": [
						".jpeg" as const,
						".JPEG" as const,
						".jpg" as const,
						".JPG" as const,
					],
				},
			},
		],
		excludeAcceptAllOption: true,
		multiple: false,
	};

	const annotationFilePickerOpts = {
		types: [
			{
				description: LL.FILE_DESCRIPTION_ANNOTATION(),
				accept: {
					"*/*": [
						".txt" as const,
						".TXT" as const,
						".anno3d" as const,
						".ANNO3D" as const,
					],
				},
			},
		],
		excludeAcceptAllOption: true,
		multiple: false,
	};

	function onNameChange(name: string) {
		setName(name);
		props.changeName(props.id, name);
	}

	async function onModelDataChange() {
		try {
			const filesHandle = await window.showOpenFilePicker(
				modelFilePickerOpts
			);

			const files: File[] = [];

			for await (const [, value] of filesHandle.entries()) {
				files.push(await value.getFile());
			}

			if (files[0]) {
				setModelFile(files[0]);
				props.changeModelFile(props.id, files[0]);
			}
		} catch {
			//Throws Exception when file picker is closed
		}
	}

	async function onTextureChange(remove?: boolean) {
		try {
			if (remove) {
				setTextureFile(undefined);
				props.changeTextureFile(props.id, undefined);
				return;
			}
			const filesHandle = await window.showOpenFilePicker(
				textureFilePickerOpts
			);

			const files: File[] = [];

			for await (const [, value] of filesHandle.entries()) {
				files.push(await value.getFile());
			}

			setTextureFile(files[0]);
			props.changeTextureFile(props.id, files[0]);
		} catch {
			//Throws Exception when file picker is closed
		}
	}

	async function onAnnotationChange(remove?: boolean) {
		try {
			if (remove) {
				setAnnotationFile(undefined);
				props.changeAnnotationFile(props.id, undefined);
				return;
			}
			const filesHandle = await window.showOpenFilePicker(
				annotationFilePickerOpts
			);

			const files: File[] = [];

			for await (const [, value] of filesHandle.entries()) {
				files.push(await value.getFile());
			}
			setAnnotationFile(files[0]);
			props.changeAnnotationFile(props.id, files[0]);
		} catch {
			//Throws Exception when file picker is closed
		}
	}

	return (
		<StandardContainer>
			<div className="my-4 flex">
				<div className="grid flex-auto grid-cols-4 gap-4 p-6">
					<div className="overflow-clip">
						<p>{LL.NAME()}</p>
						<input
							className="input input-sm"
							type="text"
							value={name}
							onInput={() => {
								onNameChange(nameRef.current!.value);
							}}
							ref={nameRef}
						/>
						{props.name === "" && (
							<label className="label">
								<span className="label-text-alt -mt-2 text-error">
									{LL.SPECIFY_NAME()}
								</span>
							</label>
						)}
					</div>

					<div className="overflow-clip">
						<div className="flex">
							<p>{LL.MODEL_FILE_NAME()}</p>
							<div
								className="ml-1 h-5 w-5 cursor-pointer text-base-content hover:scale-110"
								onClick={() => {
									void onModelDataChange();
								}}
							>
								<Edit />
							</div>
						</div>
						{modelFile?.name}
					</div>
					<div
						className={
							props.modelType === ModelType.POINT_CLOUD
								? "opacity-25"
								: ""
						}
					>
						<div className={"overflow-x-auto"}>
							<div className="flex">
								<p>{LL.TEXTURE_FILE_NAME()}</p>
								<div
									className={
										props.modelType ===
										ModelType.POINT_CLOUD
											? ""
											: "cursor-pointer hover:scale-110"
									}
								>
									<div
										className="ml-1 h-5 w-5 text-base-content"
										onClick={() => {
											if (
												props.modelType !==
												ModelType.POINT_CLOUD
											) {
												onTextureChange();
											}
										}}
									>
										<Edit />
									</div>
								</div>
								<div
									className={
										props.modelType ===
										ModelType.POINT_CLOUD
											? ""
											: "cursor-pointer hover:scale-110"
									}
								>
									<div
										className="ml-1 h-5 w-5 text-base-content"
										onClick={() => {
											if (
												props.modelType !==
												ModelType.POINT_CLOUD
											) {
												onTextureChange(true);
											}
										}}
									>
										<Delete />
									</div>
								</div>
							</div>
							<div
								className={
									props.modelType === ModelType.POINT_CLOUD
										? "line-through"
										: ""
								}
							>
								{textureFile?.name}
							</div>
						</div>
					</div>

					<div className="overflow-clip">
						<div className="flex">
							<p>{LL.ANNOTATION_FILE_NAME()}</p>
							<div
								className="ml-1 h-5 w-5 cursor-pointer text-base-content hover:scale-110"
								onClick={() => {
									onAnnotationChange();
								}}
							>
								<Edit />
							</div>
							<div
								className="ml-1 h-5 w-5 cursor-pointer text-base-content hover:scale-110"
								onClick={() => {
									onAnnotationChange(true);
								}}
							>
								<Delete />
							</div>
						</div>

						{annotationFile?.name}
					</div>
				</div>
				<div
					className="my-auto mx-4 h-10 w-10 cursor-pointer hover:scale-110"
					onClick={() => {
						props.removePreviewItem(props.id);
					}}
				>
					<Delete />
				</div>
			</div>
		</StandardContainer>
	);
}
