import { type Vector2 } from "three";
import { type ListenerBundle, type ListenerConfig } from "./Listener";

/**
 * Represents the pointer
 */
export interface Pointer {
	hasMoved: boolean;
	position: Vector2;
	buttons: MouseButtons;
}

/**
 * The different mouse inputs
 */
export enum MouseButtons {
	NONE = 0,
	PRIMARY = 1,
	SECONDARY = 2,
	AUXILIARY = 4,
	FOURTH = 8,
	FIFTH = 16,
}

/**
 * A bundle of pointer Listeners
 */
export class PointerListenerBundle<T extends Pointer>
	implements ListenerBundle
{
	private readonly pointer: T;

	/**
	 * A PointerMoveListener
	 */
	private readonly pointerMove: ListenerConfig<"pointermove"> = {
		name: "pointermove",
		listener: this.pointerMoveListener.bind(this),
	};

	/**
	 * A PointerMoveListener
	 */
	private readonly pointerDown: ListenerConfig<"pointerdown"> = {
		name: "pointerdown",
		listener: this.pointerDownListener.bind(this),
	};

	/**
	 * A PointerUpListener
	 */
	private readonly pointerUp: ListenerConfig<"pointerup"> = {
		name: "pointerup",
		listener: this.pointerUpListener.bind(this),
	};

	public configs = [this.pointerMove, this.pointerDown, this.pointerUp];

	/**
	 * Constructs a new PointerListenerBundle
	 *
	 * @param pointer the pointer
	 */
	constructor(pointer: T) {
		this.pointer = pointer;
	}

	/**
	 * Defines the PointerMoveListener
	 *
	 * @param event the pointer event
	 */
	private pointerMoveListener(event: PointerEvent) {
		this.pointer.hasMoved = true;
		this.pointer.position.x = (event.clientX / window.innerWidth) * 2 - 1;
		this.pointer.position.y = -(event.clientY / window.innerHeight) * 2 + 1;
	}

	/**
	 * Defines the PointerDownListener
	 *
	 * @param event the pointer event
	 */
	private pointerDownListener(event: PointerEvent) {
		this.pointer.buttons = event.buttons;
	}

	/**
	 * Defines the PointerUpListener
	 *
	 * @param event the pointer event
	 */
	private pointerUpListener() {
		this.pointer.buttons = MouseButtons.NONE;
	}
}
