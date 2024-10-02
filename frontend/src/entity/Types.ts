/**
 * A nested object
 */
export type NestedObject<T, V> = {
	[K in keyof T]: T[K] extends object ? NestedObject<T[K], V> : V;
};

/**
 * A optional  nested object
 */
export type OptionalNestedObject<T, V> = Partial<NestedObject<T, V>>;

/**
 * An Observer
 */
export type Observer<T, R = void> = (value: T) => R;

/**
 * A unsubscribe call
 */
export type Unsubscribe = () => void;

/**
 * A update call
 */
export interface Updatable<T = void> {
	update(data: T): void;
}

/**
 * A dispose call
 */
export interface Disposable<T = void> {
	dispose(data: T): void;
}
