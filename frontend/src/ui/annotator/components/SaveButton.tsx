import { useI18nContext } from "i18n/i18n-react";
import { toast } from "react-toastify";
import SaveTool from "~assets/icons/save.png";
import {
	useAnnotator,
	useModelInformation,
} from "~ui/annotator/contexts/AnnotatorContext";
import { ToolButton } from "~ui/components/ToolButton";
import { useAPI } from "~ui/contexts/APIContext";

export function SaveButton() {
	const { LL } = useI18nContext();
	const api = useAPI();
	const annotator = useAnnotator();
	const modelInformation = useModelInformation();

	async function onSaveHandler() {
		if (!annotator || !modelInformation) return;

		const id = toast.info(LL.SAVING(), {
			isLoading: true,
		});

		await annotator.save();

		const dataStream = await annotator.fileManager.readAnnotationFile();
		const res = await api.files.uploadAnnotationFile(
			modelInformation.id,
			dataStream,
			(n) => {
				console.log(`Upload annotation file: ${n.toFixed(0)}%`);
			}
		);

		if (res.isErr()) {
			toast.update(id, {
				isLoading: false,
				render: LL.UPLOAD_ERROR(),
				type: "error",
			});
			return;
		}

		toast.update(id, {
			isLoading: false,
			render: LL.SAVING_SUCCESS(),
			type: "success",
			autoClose: 3000,
		});
	}

	return (
		<ToolButton
			imagePath={SaveTool}
			toolAlt={LL.SAVE()}
			toolFunc={onSaveHandler}
			key={2}
			selected={false}
		/>
	);
}
