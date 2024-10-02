import { useI18nContext } from "i18n/i18n-react";
import { useState } from "react";
import { DEFAULT_POINT_SIZE } from "~annotator/scene/model/builder/PointCloudBuilder";
import { ModelType } from "~entity/ModelInformation";
import {
	useAnnotator,
	useModelInformation,
} from "~ui/annotator/contexts/AnnotatorContext";
import { StandardContainer } from "~ui/components/StandardContainer";

export function PointSettings() {
	const annotator = useAnnotator();
	const modelInformation = useModelInformation();
	const { LL } = useI18nContext();

	const [collapsed, setCollapsed] = useState(true);
	const [pointSize, setPointSize] = useState<number>(DEFAULT_POINT_SIZE);

	function onPointSizeChange(fov: number): void {
		annotator?.sceneManager.setPointSize(fov);
		setPointSize(fov);
	}

	return modelInformation?.modelType === ModelType.POINT_CLOUD ? (
		<StandardContainer styling="select-none p-5 pb-2">
			<h1
				className={`mb-2 -mt-2 text-center text-xl ${
					annotator ? "hover:cursor-pointer" : ""
				}`}
				onClick={() => {
					if (!annotator) return;

					setCollapsed((currentState) => !currentState);
				}}
			>
				{LL.POINTS()}
			</h1>
			<div className={collapsed ? "hidden" : ""}>
				<div className="mt-3 flex place-content-between">
					<div>
						<p>{LL.POINT_SIZE()}</p>
					</div>
					<div>{pointSize}</div>
				</div>
				<div className="mt-2">
					<input
						type="range"
						min={0}
						max={1}
						step={0.01}
						value={pointSize}
						className="range range-primary range-xs"
						onChange={({ target }) => {
							onPointSizeChange(+target.value);
						}}
					/>
				</div>
			</div>
		</StandardContainer>
	) : (
		<></>
	);
}
