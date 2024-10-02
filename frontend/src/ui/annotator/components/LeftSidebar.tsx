import React from "react";
import type { Model } from "~annotator/scene/model/Model";
import type { Tool } from "~annotator/tools/Tool";
import { useAnnotator } from "~ui/annotator/contexts/AnnotatorContext";
import { useTools } from "~ui/annotator/hooks/Tools";
import { RenderButton } from "./RenderButton";
import { SaveButton } from "./SaveButton";

export function LeftSidebar() {
	const annotator = useAnnotator();
	const { tools, selectedTool } = useTools();

	function selectTool(newTool: Tool<Model>) {
		if (!annotator) return;

		if (newTool === selectedTool) {
			annotator.toolManager.unselectCurrentTool();
			return;
		}

		annotator.toolManager.selectTool(newTool);
	}

	const toolButtons = tools.map((tool, index) =>
		React.createElement(tool.getToolButtonComponent(), {
			onClick: () => {
				selectTool(tool);
			},
			key: index,
			selected: selectedTool === tool,
		})
	);

	return (
		<div className="fixed flex h-full w-16 flex-col bg-neutral pb-16">
			<div className="flex grow flex-col">{toolButtons}</div>
			<div className="bottom-0 flex grow flex-col place-content-end">
				<div>
					<SaveButton></SaveButton>
				</div>
				<div>
					<RenderButton></RenderButton>
				</div>
			</div>
		</div>
	);
}
