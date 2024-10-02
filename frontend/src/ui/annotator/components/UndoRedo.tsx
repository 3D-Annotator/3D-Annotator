import { useEffect, useState } from "react";
import type { UndoRedoCount } from "~annotator/annotation/undo/UndoManager";
import Redo from "~assets/icons/redo.png";
import Undo from "~assets/icons/undo.png";
import { useAnnotator } from "~ui/annotator/contexts/AnnotatorContext";
import { ToolButton } from "~ui/components/ToolButton";

function useUndoRedoState() {
	const annotator = useAnnotator();
	const [undoRedo, setUndoRedo] = useState({
		hasUndos: false,
		hasRedos: false,
	});

	function undoRedoCountObserver(count: UndoRedoCount) {
		setUndoRedo({
			hasUndos: count.undos !== 0,
			hasRedos: count.redos !== 0,
		});
	}

	useEffect(() => {
		if (!annotator) return;
		return annotator.undoManager.addUndoRedoCountObserver(
			undoRedoCountObserver
		);
	}, [annotator]);

	function undoHandler() {
		if (!annotator) return;
		annotator.undoManager.undo();
	}

	function redoHandler() {
		if (!annotator) return;
		annotator.undoManager.redo();
	}

	return {
		hasUndos: undoRedo.hasUndos,
		hasRedos: undoRedo.hasRedos,
		undoHandler,
		redoHandler,
	};
}

export function UndoButton() {
	const { undoHandler, hasUndos } = useUndoRedoState();
	return (
		<ToolButton
			imagePath={Undo}
			toolFunc={undoHandler}
			key={-2}
			disabled={!hasUndos}
		/>
	);
}

export function RedoButton() {
	const { redoHandler, hasRedos } = useUndoRedoState();
	return (
		<ToolButton
			imagePath={Redo}
			toolFunc={redoHandler}
			key={-3}
			disabled={!hasRedos}
		/>
	);
}
