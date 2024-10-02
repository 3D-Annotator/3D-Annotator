export {};

declare global {
	// postMessage with typed message parameter

	declare function postMessage<T>(
		message: T,
		targetOrigin: string,
		transfer?: Transferable[]
	): void;
	declare function postMessage<T>(
		message: T,
		options?: WindowPostMessageOptions
	): void;

	interface Worker {
		postMessage<T>(message: T, transfer: Transferable[]): void;
		postMessage<T>(message: T, options?: StructuredSerializeOptions): void;
	}
}
