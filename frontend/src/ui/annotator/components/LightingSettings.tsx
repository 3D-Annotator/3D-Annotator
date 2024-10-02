import { useI18nContext } from "i18n/i18n-react";
import { useState } from "react";
import { DEFAULT_GLOBAL_LIGHT_INTENSITY } from "~annotator/scene/lighting/GlobalLighting";
import { DEFAULT_SUN_LIGHT_INTENSITY } from "~annotator/scene/lighting/SunLighting";
import { ModelType } from "~entity/ModelInformation";
import { Perspective } from "~entity/Perspective";
import {
	useAnnotator,
	useModelInformation,
} from "~ui/annotator/contexts/AnnotatorContext";
import { StandardContainer } from "~ui/components/StandardContainer";

const SUN_POSITION_EMPTY = "-";

export function LightingSettings() {
	const annotator = useAnnotator();
	const modelInformation = useModelInformation();
	const { LL } = useI18nContext();

	const [collapsed, setCollapsed] = useState(true);
	const [isSunActiveState, setIsSunActiveState] = useState(true);
	const [isFollowingCameraState, setIsFollowingCameraState] = useState(false);
	const [sunPositionState, setSunPositionState] = useState<string>(
		Perspective.TOP.toString()
	);

	function setGlobalLightIntensity(intensity: number) {
		annotator!.sceneManager
			.getGlobalLighting()
			.setLightIntensity(intensity);
	}

	function setIsSunActive(isActive: boolean) {
		annotator!.sceneManager.getSunLighting().setIsActive(isActive);
		setIsSunActiveState(isActive);
	}

	function setSunLightIntensity(intensity: number) {
		annotator!.sceneManager.getSunLighting().setLightIntensity(intensity);
	}

	function setSunPosition(value: string) {
		annotator!.sceneManager
			.getSunLighting()
			.setSunPosition(parseInt(value));
		setSunPositionState(value);
		setIsFollowingCameraState(false);
		setFollowCamera(false);
	}

	function setSunToCameraPosition() {
		annotator!.sceneManager.getSunLighting().setSunToCameraPosition();
	}

	function setFollowCamera(follow: boolean) {
		annotator!.sceneManager.getSunLighting().setFollowCamera(follow);
	}

	return modelInformation?.modelType === ModelType.MESH ? (
		<StandardContainer styling="select-none p-5 pb-2">
			<h1
				className={`mb-2 -mt-2 text-center text-xl ${
					annotator ? "hover:cursor-pointer" : ""
				}`}
				onClick={() => {
					if (!annotator) return;

					setCollapsed(!collapsed);
				}}
			>
				{LL.LIGHTING()}
			</h1>

			<div className={collapsed ? "hidden" : ""}>
				<label className="label pl-0">
					<span className="label-text">{LL.GLOBAL_BRIGHTNESS()}</span>
					<input
						type="range"
						name="global-light-intensity"
						className="range range-primary range-xs"
						step={0.1}
						min={0}
						max={2}
						defaultValue={DEFAULT_GLOBAL_LIGHT_INTENSITY}
						onChange={(e) => {
							setGlobalLightIntensity(parseFloat(e.target.value));
						}}
					/>
				</label>

				<div className="divider text-sm">{LL.SUN()}</div>

				<label className="label -mt-4 cursor-pointer pl-0">
					<span className="label-text">{LL.SUN()}</span>
					<input
						type="checkbox"
						name="Lighting-mode"
						className="toggle toggle-primary"
						checked={isSunActiveState}
						onChange={(e) => {
							setIsSunActive(e.target.checked);
						}}
					/>
				</label>

				<label className="label pl-0">
					<span className="label-text mr-4">{LL.BRIGHTNESS()}</span>
					<input
						type="range"
						name="sun-light-intensity"
						className="range range-primary range-xs "
						step={0.1}
						min={0}
						max={5}
						defaultValue={DEFAULT_SUN_LIGHT_INTENSITY}
						disabled={!isSunActiveState}
						onChange={(e) => {
							setSunLightIntensity(parseFloat(e.target.value));
						}}
					/>
				</label>

				<label htmlFor="sunPos">
					<span className="label-text">{LL.AXIS_POSITION()}</span>
					<select
						id="sunPos"
						className="select w-full max-w-xs"
						value={sunPositionState}
						disabled={!isSunActiveState}
						onChange={(e) => {
							setSunPosition(e.target.value);
						}}
					>
						<option value={Perspective.TOP}>{LL.TOP()}</option>
						<option value={Perspective.BOTTOM}>
							{LL.BOTTOM()}
						</option>
						<option value={Perspective.RIGHT}>{LL.RIGHT()}</option>
						<option value={Perspective.LEFT}>{LL.LEFT()}</option>
						<option value={Perspective.FRONT}>{LL.FRONT()}</option>
						<option value={Perspective.BACK}>{LL.BACK()}</option>
						{sunPositionState === SUN_POSITION_EMPTY && (
							<option disabled value={SUN_POSITION_EMPTY}>
								{SUN_POSITION_EMPTY}
							</option>
						)}
					</select>
				</label>

				<div className="divider text-sm">
					{LL.CAMERA_CONTROLLED_SUN()}
				</div>

				<div className="flex">
					<button
						type="button"
						className="btn btn-primary normal-case"
						name="set-sun"
						disabled={!isSunActiveState}
						onClick={() => {
							setSunToCameraPosition();
							setIsFollowingCameraState(false);
							setFollowCamera(false);
							setSunPositionState(SUN_POSITION_EMPTY);
						}}
					>
						{LL.SET_POSITION()}
					</button>

					<div className="ml-4">
						<label
							htmlFor="follow-camera"
							className="cursor-pointer"
						>
							<p className="label-text pb-1 ">
								{LL.FOLLOW_CAMERA()}
							</p>
						</label>
						<input
							type="checkbox"
							name="follow-camera"
							className="toggle toggle-primary"
							checked={isFollowingCameraState}
							disabled={!isSunActiveState}
							onChange={(e) => {
								setSunToCameraPosition();
								setFollowCamera(e.target.checked);
								setIsFollowingCameraState(e.target.checked);
								setSunPositionState(SUN_POSITION_EMPTY);
							}}
						/>
					</div>
				</div>
			</div>
		</StandardContainer>
	) : (
		<></>
	);
}
