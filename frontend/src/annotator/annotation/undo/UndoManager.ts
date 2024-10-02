import {
	type Disposable,
	type Observer,
	type Unsubscribe,
} from "~entity/Types";

export interface UndoRedoCount {
	undos: number;
	redos: number;
}

export interface UndoManager extends Disposable {
	startGroup(): void;
	endGroup(): void;

	undo(): void;
	redo(): void;

	activate(): void;
	deactivate(): void;

	reset(hard?: boolean): void;

	addUndoRedoCountObserver(observer: Observer<UndoRedoCount>): Unsubscribe;
}
