/**
 * {@link setTimeout()} as a `Promise`.
 *
 * @param milliseconds duration in milliseconds
 * @returns a promise that resolves with the {@link setTimeout()} callback
 */
export function wait(milliseconds = 0): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, milliseconds);
	});
}

/**
 * {@link requestAnimationFrame()} as a `Promise`.
 *
 * @returns a promise that resolves with the next animation frame
 */
export function waitRAF(): Promise<void> {
	return new Promise((resolve) => {
		requestAnimationFrame(() => {
			resolve();
		});
	});
}

/**
 * Returns a new function that executes the given function only if a given number
 * of milliseconds have passed since the last execution or if the `execute` flag is
 * set to `true`.
 *
 * @param fn the function to execute
 * @param interval the interval in milliseconds (default is 10 ms)
 * @returns the created function
 */
export function createTimeoutProxy<T>(fn: (value: T) => void, interval = 10) {
	let lastExecutionTime = performance.now();
	return function proxy(argument: T, execute?: boolean) {
		const currentTime = performance.now();
		if (currentTime - lastExecutionTime >= interval || execute) {
			fn(argument);
			lastExecutionTime = currentTime;
		}
	};
}
