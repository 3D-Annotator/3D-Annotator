import { ModelName as ModelNameIcon } from "~assets/icons/ModelName";
import { useModelInformation } from "~ui/annotator/contexts/AnnotatorContext";

export function ModelName() {
	const modelInformation = useModelInformation();

	return modelInformation ? (
		<div className="flex gap-1">
			<div className="m-auto h-5 w-5 text-slate-50">
				<ModelNameIcon />
			</div>
			<h1 className="select-none text-lg text-slate-50">
				{modelInformation.name}
			</h1>
		</div>
	) : (
		<div></div>
	);
}
