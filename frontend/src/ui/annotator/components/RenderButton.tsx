import { useI18nContext } from "i18n/i18n-react";
import Render from "~assets/icons/camera.png";
import {
	useAnnotator,
	useModelInformation,
} from "~ui/annotator/contexts/AnnotatorContext";
import { ToolButton } from "~ui/components/ToolButton";
import { writeBlobToLocalFileSystem } from "~util/FileUtils";

export function RenderButton() {
	const { LL } = useI18nContext();
	const annotator = useAnnotator();
	const modelInformation = useModelInformation();

	async function render() {
		if (!annotator || !modelInformation) return;

		const blob = await annotator.sceneManager.renderImage();
		await writeBlobToLocalFileSystem(blob, {
			suggestedName: `screenshot ${
				modelInformation.name
			} (${new Date().toISOString()}).png`,
		});
	}

	return (
		<ToolButton
			imagePath={Render}
			toolAlt={LL.RENDER()}
			toolFunc={render}
			key={3}
			selected={false}
		/>
	);
}
