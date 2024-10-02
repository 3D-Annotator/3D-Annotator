export function progressInPercent({
	loaded,
	total,
}: {
	loaded: number;
	total: number;
}): number {
	return (100 * loaded) / total;
}

/**
 * Returns the underlying ArrayBuffers of all ArrayBuffer
 * views inside of the given string map.
 *
 * @param values a map of possible ArrayBuffer views
 * @returns the underlying ArrayBuffers
 */
export function findArrayBuffers(
	values: Record<string, unknown>
): ArrayBuffer[] {
	const arrayBuffers: ArrayBuffer[] = [];
	for (const key in values) {
		const element = values[key];
		if (ArrayBuffer.isView(element)) {
			arrayBuffers.push(element.buffer);
		}
	}
	return arrayBuffers;
}
