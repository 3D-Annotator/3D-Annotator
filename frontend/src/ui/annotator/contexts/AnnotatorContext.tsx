import {
	createContext,
	useContext,
	useState,
	type PropsWithChildren,
} from "react";
import type { Annotator } from "~annotator/Annotator";
import type { Model } from "~annotator/scene/model/Model";
import type { ModelInformation } from "~entity/ModelInformation";

interface AnnotatorContext {
	annotator: Annotator<Model> | null;
	setAnnotator: (annotator: Annotator<Model>) => void;
	modelInformation: ModelInformation | null;
	setModelInformation: (modelInformation: ModelInformation) => void;
}

const ANNOTATOR_CONTEXT = createContext<AnnotatorContext>({
	annotator: null,
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	setAnnotator: () => {},
	modelInformation: null,
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	setModelInformation: () => {},
});

export function useAnnotator() {
	const { annotator } = useContext(ANNOTATOR_CONTEXT);
	return annotator;
}

export function useModelInformation() {
	const { modelInformation } = useContext(ANNOTATOR_CONTEXT);
	return modelInformation;
}

export function useAnnotatorContext() {
	return useContext(ANNOTATOR_CONTEXT);
}

export function AnnotatorProvider(props: PropsWithChildren) {
	const [annotator, setAnnotator] = useState<Annotator<Model> | null>(null);
	const [modelInformation, setModelInformation] =
		useState<ModelInformation | null>(null);

	return (
		<ANNOTATOR_CONTEXT.Provider
			value={{
				annotator,
				setAnnotator,
				modelInformation,
				setModelInformation,
			}}
			{...props}
		/>
	);
}
