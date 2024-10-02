import { type AnnotationManager } from "~annotator/annotation/AnnotationManager";
import { type UndoManager } from "~annotator/annotation/undo/UndoManager";
import { type Scene } from "~annotator/scene/Scene";
import { type Model } from "~annotator/scene/model/Model";
import {
	type Disposable,
	type Observer,
	type Unsubscribe,
} from "~entity/Types";
import { type Tool } from "./Tool";

/**
 * Manages tools compatible to the model type T
 */
export abstract class ToolManager<T extends Model> implements Disposable {
	protected readonly annotationManager: AnnotationManager;
	protected readonly undoManager: UndoManager;
	protected readonly scene: Scene<T>;

	private readonly selectedToolObservers = new Set<
		Observer<Tool<Model> | undefined>
	>();

	private readonly tools: Tool<T>[];
	private current?: Tool<T>;

	private unsubscribeFromScene?: Unsubscribe;

	/**
	 * Constructs a new instance of ToolManager
	 *
	 * @param annotationManager an AnnotationManager
	 * @param scene a scene
	 */
	constructor(
		annotationManager: AnnotationManager,
		undoManager: UndoManager,
		scene: Scene<T>
	) {
		this.annotationManager = annotationManager;
		this.undoManager = undoManager;
		this.scene = scene;
		this.tools = this.initializeTools();
	}

	/**
	 * Initializes all tools by calling load on each of them
	 *
	 * @returns an array of tools of type T
	 */
	private initializeTools(): Tool<T>[] {
		const tools = this.createTools();
		for (const tool of tools) {
			tool.load();
		}
		return tools;
	}

	/**
	 * Adds a observer listening to the selected tool
	 *
	 * @param observer the observer
	 * @returns the unsubscribe callback
	 */
	public addSelectedToolObserver(
		observer: Observer<Tool<Model> | undefined>
	): Unsubscribe {
		this.selectedToolObservers.add(observer);
		observer(this.current);
		return () => {
			this.selectedToolObservers.delete(observer);
		};
	}

	/**
	 * Notifies all subscribed observers when the selected tool changes
	 */
	private notifySelectedToolObservers() {
		for (const observer of this.selectedToolObservers) {
			observer(this.current);
		}
	}

	/**
	 * Disposes all tools
	 */
	public dispose(): void {
		for (const tool of this.tools) {
			tool.dispose();
		}
	}

	/**
	 * Creates all tools of the generic type T
	 */
	protected abstract createTools(): Tool<T>[];

	/**
	 * Returns an copy of all tools managed by this manager
	 *
	 * @returns an array of tools
	 */
	public getTools(): Tool<T>[] {
		return [...this.tools];
	}

	/**
	 * Selects an tool from this manager
	 *
	 * @param tool the tool
	 */
	public selectTool(tool: Tool<T>): void {
		if (!this.tools.includes(tool)) {
			throw new Error("'tool' not found in ToolManager");
		}

		if (this.current) {
			this.unselectCurrent();
		}

		this.current = tool;
		this.selectCurrent();
		this.notifySelectedToolObservers();
	}

	/**
	 * Unselects the current tool.
	 * If no tool is selected nothing happens.
	 *
	 * @return the unselected tool or undefined if no tool was selected
	 */
	public unselectCurrentTool(): Tool<T> | undefined {
		const currentTool = this.current;
		if (this.current) {
			this.unselectCurrent();
			this.current = undefined;
		}
		this.notifySelectedToolObservers();
		return currentTool;
	}

	/**
	 * Selects the current tool
	 */
	private selectCurrent(): void {
		this.current!.select();
		const observer = this.current!.update.bind(this.current);
		const unsubscribe = this.scene.addRenderObserver(observer);
		this.unsubscribeFromScene = unsubscribe;
	}

	/**
	 * Unselects the current tool
	 */
	private unselectCurrent(): void {
		this.current!.unselect();
		if (this.unsubscribeFromScene) {
			this.unsubscribeFromScene();
		}
	}
}
