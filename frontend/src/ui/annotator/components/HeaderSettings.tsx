import React from "react";
import { useTools } from "~ui/annotator/hooks/Tools";
import { Eraser } from "./Eraser";
import { HelpButton } from "./Help";
import { RedoButton, UndoButton } from "./UndoRedo";

export function HeaderSettings() {
	const { selectedTool } = useTools();
	const toolSettings = selectedTool
		? React.createElement(selectedTool.getQuickSettingsComponent(), {
				tool: selectedTool,
		  })
		: null;

	return (
		<div className="flex flex-grow items-center">
			<UndoButton></UndoButton>
			<RedoButton></RedoButton>
			<Eraser></Eraser>
			{toolSettings}
			<HelpButton></HelpButton>
		</div>
	);
}
