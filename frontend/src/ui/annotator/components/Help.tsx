import React from "react";
import { create } from "zustand";
import { Help } from "~assets/icons/Help";
import { HelpFilled } from "~assets/icons/HelpFilled";
import { useTools } from "~ui/annotator/hooks/Tools";
import { StandardContainer } from "~ui/components/StandardContainer";

interface HelpStore {
	helpVisible: boolean;
	setHelpVisible: (visible: boolean) => void;
}

const useHelpStore = create<HelpStore>((set) => ({
	helpVisible: false,
	setHelpVisible: (visible) => {
		set({ helpVisible: visible });
	},
}));

function useHelpState() {
	const { selectedTool } = useTools();

	const component = selectedTool?.getHelpContentComponent();
	const helpContent = component ? React.createElement(component) : null;

	const { helpVisible, setHelpVisible } = useHelpStore();

	return {
		helpContent,
		helpVisible,
		setHelpVisible,
	};
}

export function HelpButton() {
	const { helpContent, helpVisible, setHelpVisible } = useHelpState();

	if (helpContent) {
		return (
			<button
				className="selectNone ml-auto h-8 w-8"
				onClick={() => {
					setHelpVisible(!helpVisible);
				}}
				key={-4}
			>
				{helpVisible ? <HelpFilled /> : <Help />}
			</button>
		);
	} else {
		return null;
	}
}

export function HelpContent() {
	const { helpContent, helpVisible } = useHelpState();

	if (helpContent && helpVisible) {
		return (
			<StandardContainer>
				<div className="p-2">{helpContent}</div>
			</StandardContainer>
		);
	} else {
		return null;
	}
}
