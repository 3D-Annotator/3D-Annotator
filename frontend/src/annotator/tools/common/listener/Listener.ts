/**
 * A bundle of listeners
 */
export interface ListenerBundle {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	configs: ListenerConfig<any>[];
}

/**
 * A listener configuration
 */
export interface ListenerConfig<K extends keyof HTMLElementEventMap> {
	name: K;
	listener: (this: HTMLCanvasElement, ev: HTMLElementEventMap[K]) => void;
	options?: boolean | AddEventListenerOptions;
}

/**
 * Registers a ListenerBundle on a HTMLElement
 *
 * @param element the HTMLElement
 * @param listenerBundles the ListenerBundle
 */
export function registerListenerBundles(
	element: HTMLElement,
	listenerBundles: ListenerBundle[]
): void {
	for (const listenerBundle of listenerBundles) {
		for (const { name, listener, options } of listenerBundle.configs) {
			element.addEventListener(name as string, listener, options);
		}
	}
}

/**
 * Unregister a ListenerBundle of a HTMLElement
 *
 * @param element the HTMLElement
 * @param listenerBundles the ListenerBundle
 */
export function unregisterListenerBundles(
	element: HTMLElement,
	listenerBundles: ListenerBundle[]
): void {
	for (const listenerBundle of listenerBundles) {
		for (const { name, listener, options } of listenerBundle.configs) {
			element.removeEventListener(name as string, listener, options);
		}
	}
}
