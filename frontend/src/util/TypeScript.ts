export function assertUnreachable(value: never): never {
	throw new Error("Unreachable code. Use TypeScript!", value);
}

export type ExcludeMethods<T> = {
	// eslint-disable-next-line @typescript-eslint/ban-types
	[P in keyof T as T[P] extends Function ? never : P]: T[P];
};
