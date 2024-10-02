import { useEffect, useState } from "react";
import type { Model } from "~annotator/scene/model/Model";
import type { Tool } from "~annotator/tools/Tool";
import { useAnnotator } from "../contexts/AnnotatorContext";

export function useTools() {
	const [tools, setTools] = useState<Tool<Model>[]>([]);
	const [selectedTool, setSelectedTool] = useState<Tool<Model> | undefined>(
		undefined
	);
	const annotator = useAnnotator();

	useEffect(() => {
		if (!annotator) return;

		const tools = annotator.toolManager.getTools();
		setTools(tools);

		const unsubscribe = annotator.toolManager.addSelectedToolObserver(
			(tool) => {
				if (tool) {
					setSelectedTool(tool);
				} else {
					setSelectedTool(undefined);
				}
			}
		);

		return unsubscribe;
	}, [annotator]);

	function notifyToolsChange() {
		if (!annotator) return;

		setTools(annotator.toolManager.getTools());
	}

	return {
		tools,
		selectedTool,
		notifyToolsChange,
	};
}
