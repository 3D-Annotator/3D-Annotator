import { type UndoManager } from "~annotator/annotation/undo/UndoManager";
import { MouseButtons, type Pointer } from "../listener/PointerListenerBundle";

export class PointerUndoHandler {
	private readonly undoManager: UndoManager;
	private readonly mouseButtons: MouseButtons;

	private groupStarted = false;

	constructor(undoManger: UndoManager, mouseButton = MouseButtons.PRIMARY) {
		this.undoManager = undoManger;
		this.mouseButtons = mouseButton;
	}

	public onUpdate(pointer: Pointer) {
		if (pointer.buttons === this.mouseButtons && !this.groupStarted) {
			this.groupStarted = true;
			this.undoManager.startGroup();
		} else if (pointer.buttons !== this.mouseButtons && this.groupStarted) {
			this.groupStarted = false;
			this.undoManager.endGroup();
		}
	}
}
