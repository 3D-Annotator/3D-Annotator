import { type FC } from "react";
import { Vector2 } from "three";
import { type Disposable, type Updatable } from "~entity/Types";
import { type AnnotationManager } from "../annotation/AnnotationManager";
import { type UndoManager } from "../annotation/undo/UndoManager";
import { type Scene } from "../scene/Scene";
import { type Model } from "../scene/model/Model";
import {
	registerListenerBundles,
	unregisterListenerBundles,
	type ListenerBundle,
} from "./common/listener/Listener";
import {
	MouseButtons,
	PointerListenerBundle,
} from "./common/listener/PointerListenerBundle";

const DEFAULT_CURSOR: Cursor = "crosshair";

export type Cursor = "none" | "crosshair";

export interface ToolButtonProps {
	onClick: () => void;
	selected: boolean;
}

export interface ToolQuickSettingsProps {
	tool: Tool<Model>;
}

export interface ToolHelpContentProps {}

/**
 * Defines an abstract structure of a tool
 */
export abstract class Tool<T extends Model> implements Updatable, Disposable {
	protected readonly scene: Scene<T>;
	protected readonly annotationManager: AnnotationManager;
	protected readonly undoManager: UndoManager;
	protected readonly name: string;

	/**
	 * Contains the current information about the pointer
	 */
	protected pointer = {
		hasMoved: false,
		position: new Vector2(),
		buttons: MouseButtons.NONE,
	};

	/**
	 * A bundle of listener often used by tools
	 */
	protected pointerListenerBundle = new PointerListenerBundle(this.pointer);

	/**
	 * Constructs an new instance of a tool
	 *
	 * @param name the name of the tool
	 * @param annotationManager an annotation manager
	 * @param scene a scene
	 */
	constructor(
		name: string,
		annotationManager: AnnotationManager,
		undoManager: UndoManager,
		scene: Scene<T>
	) {
		this.name = name;
		this.annotationManager = annotationManager;
		this.undoManager = undoManager;
		this.scene = scene;
	}

	/**
	 * Returns a bundle of listeners often used while a tool is loading
	 *
	 * @returns a bundle of listeners
	 */
	protected getOnLoadListenerBundles(): ListenerBundle[] {
		return [];
	}

	/**
	 * Returns a bundle of listeners often used while tool is selected
	 *
	 * @returns a bundle of listeners
	 */
	protected getOnSelectedListenerBundles(): ListenerBundle[] {
		return [];
	}

	public getCursor(): Cursor {
		return DEFAULT_CURSOR;
	}

	/**
	 * Loads a tool
	 * registers all loading listener and calls {@link onLoad}
	 */
	public load(): void {
		console.log(`loading ${this.name}`);

		registerListenerBundles(
			this.scene.getCanvas(),
			this.getOnLoadListenerBundles()
		);
		this.onLoad();
	}

	/**
	 * A Method where the tool can define what happens when its loading
	 */
	protected abstract onLoad(): void;

	/**
	 * Selects the tool
	 * and calls {@link onSelected}
	 */
	public select(): void {
		console.log(`selecting ${this.name}`);
		registerListenerBundles(
			this.scene.getCanvas(),
			this.getOnSelectedListenerBundles()
		);
		this.onSelected();
	}

	/**
	 * A Method where the tool can define what happens when its selected
	 */
	protected abstract onSelected(): void;

	/**
	 * Updates the tool
	 * and calls {@link onUpdate}
	 */
	public update(): void {
		this.onUpdate();
		this.pointer.hasMoved = false;
	}

	/**
	 * A Method where the tool can define what happens when its unselected
	 */
	protected abstract onUpdate(): void;

	/**
	 * Selects the tool
	 * and calls {@link onUnselected}
	 */
	public unselect(): void {
		console.log(`unselecting ${this.name}`);
		unregisterListenerBundles(
			this.scene.getCanvas(),
			this.getOnSelectedListenerBundles()
		);
		this.onUnselected();
	}

	/**
	 * A Method where the tool can define what happens when its selected
	 */
	protected abstract onUnselected(): void;

	/**
	 * Disposes the tool
	 * and calls {@link onDispose}
	 */
	public dispose(): void {
		console.log(`disposing ${this.name}`);
		unregisterListenerBundles(
			this.scene.getCanvas(),
			this.getOnLoadListenerBundles()
		);
		this.onDispose();
	}

	/**
	 * A Method where the tool can define what happens when its disposed
	 */
	protected abstract onDispose(): void;

	/**
	 * Returns the tool button to select the tool
	 */
	public abstract getToolButtonComponent(): FC<ToolButtonProps>;

	/**
	 * Returns the quick settings component that contains all quick settings of an tool
	 */
	public abstract getQuickSettingsComponent(): FC<ToolQuickSettingsProps>;

	/**
	 * Returns an optional component containing usage info.
	 */
	public getHelpContentComponent(): FC<ToolHelpContentProps> | null {
		return null;
	}
}
