import { useRef } from "react";
import { ANNOTATOR_BG_COLOR } from "~annotator/scene/Scene";
import { Header } from "~ui/components/Header";
import { LanguageSelector } from "~ui/components/LanguageSelector";
import { CameraPerspective } from "./components/CameraPerspective";
import { CameraSettings } from "./components/CameraSettings";
import { HeaderSettings } from "./components/HeaderSettings";
import { HelpContent } from "./components/Help";
import { LabelMenu } from "./components/LabelMenu";
import { LeftSidebar } from "./components/LeftSidebar";
import { LightingSettings } from "./components/LightingSettings";
import { LoadingState } from "./components/LoadingState";
import { ModelName } from "./components/ModelName";
import { PointSettings } from "./components/PointSettings";
import { Stats } from "./components/Stats";
import { AnnotatorProvider } from "./contexts/AnnotatorContext";
import { useCursor } from "./hooks/Cursor";
import { useSetup } from "./hooks/Setup";

export function AnnotatorPage() {
	return (
		<AnnotatorProvider>
			<AnnotatorComponent></AnnotatorComponent>
		</AnnotatorProvider>
	);
}

function AnnotatorComponent() {
	const sceneParentRef = useRef<HTMLDivElement>(null);

	const { loadingState, error } = useSetup(sceneParentRef);
	const cursor = useCursor();

	return (
		<div
			className={`fixed h-screen ${
				loadingState.loading ? "cursor-wait" : ""
			}`}
			style={{ backgroundColor: ANNOTATOR_BG_COLOR }}
		>
			<Header>
				<div className="flex">
					<HeaderSettings />
					<div className="my-auto flex items-center ">
						<LanguageSelector />
					</div>
				</div>
			</Header>

			<LeftSidebar />

			<LabelMenu />

			<div className="absolute left-[4.75rem] -z-10 mt-2">
				<ModelName />
			</div>

			<div className="absolute bottom-4 left-20 -z-10 flex items-end gap-4">
				<CameraPerspective />
				<CameraSettings />
				<LightingSettings />
				<PointSettings />
			</div>

			<div className="absolute top-20 left-1/2 -translate-x-1/2 transform">
				<HelpContent />
			</div>

			<div
				ref={sceneParentRef}
				className={`absolute top-0 -z-20 h-full w-full ${
					loadingState.loading ? "cursor-wait" : ""
				}`}
				style={{
					cursor,
				}}
			/>

			<Stats />

			<LoadingState
				loadingState={loadingState}
				error={error}
			></LoadingState>
		</div>
	);
}
