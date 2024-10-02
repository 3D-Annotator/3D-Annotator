import { useI18nContext } from "i18n/i18n-react";
import { useState } from "react";
import { type CameraType } from "~annotator/scene/Camera";
import { useAnnotator } from "~ui/annotator/contexts/AnnotatorContext";
import { StandardContainer } from "~ui/components/StandardContainer";

export function CameraSettings() {
	const annotator = useAnnotator();
	const { LL } = useI18nContext();

	const [collapsed, setCollapsed] = useState(true);
	const [selectedCamera, setSelectedCamera] =
		useState<CameraType>("PerspectiveCamera");
	const [fov, setFov] = useState<number>(30);

	function onFOVChange(fov: number): void {
		annotator!.sceneManager.getCameraControls().setFOV(fov);
		setFov(fov);
	}

	function onShowGizmos(show: boolean): void {
		annotator!.sceneManager.getCameraControls().show(show);
	}

	function onCameraSwitch(type: CameraType): void {
		const tool = annotator!.toolManager.unselectCurrentTool();
		annotator!.sceneManager.getCameraControls().setCamera(type);
		if (tool) {
			annotator!.toolManager.selectTool(tool);
		}

		setSelectedCamera(type);
	}

	return (
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
				{LL.CAMERA()}
			</h1>
			<div className={collapsed ? "hidden" : ""}>
				<div className="mt-4 flex place-content-between">
					<div>{LL.GIZMO()}</div>
					<input
						type="checkbox"
						className="toggle"
						onChange={({ target }) => {
							onShowGizmos(target.checked);
						}}
					/>
				</div>

				<select
					className="select select-bordered select-sm mt-4 w-full max-w-xs"
					value={selectedCamera}
					onChange={({ currentTarget }) => {
						onCameraSwitch(currentTarget.value as CameraType);
					}}
				>
					<option value="PerspectiveCamera">
						{LL.PERSPECTIVE()}
					</option>
					<option value="OrthographicCamera">
						{LL.ORTHOGRAPHIC()}
					</option>
				</select>

				<div className="mt-3 flex place-content-between">
					<div>
						<p>{LL.FOV()}</p>
					</div>
					<div>{fov}°</div>
				</div>
				<div className="mt-2">
					<input
						type="range"
						min={25}
						max={90}
						step={1}
						value={fov}
						className="range range-primary range-xs"
						disabled={selectedCamera === "OrthographicCamera"}
						onChange={({ target }) => {
							onFOVChange(+target.value);
						}}
					/>
				</div>
			</div>
		</StandardContainer>
	);
}
