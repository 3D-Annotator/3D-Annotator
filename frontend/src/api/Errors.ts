/**
 * The parent class of all public API errors.
 */
export class APIError extends Error {}

/**
 * Holds a single Error.
 *
 * This type of error is used if a certain number of errors can occur
 * but only one at a time.
 *
 * @param T a subset of errors, i.e. the errors that are possible
 */
export class SingularError<T extends Errors> extends APIError {
	readonly code: T;

	constructor(code: T, message?: string) {
		super(message);
		this.code = code;
	}
}

/**
 * Holds a map of errors to booleans.
 *
 * Example:
 *
 * If the map contains the entry "Errors.USED_USER_NAME -> true",
 * the USED_USER_NAME error occurred.
 *
 * Otherwise the value will be false in which case the error
 * has not occurred.
 *
 * @param T a subset of errors, i.e. the errors that are possible
 */
export class ErrorMap<T extends Errors> extends APIError {
	private codes = new Map<T, boolean>();

	/**
	 * Sets the given error.
	 *
	 * @param error the error to set
	 * @param value the boolean value, defaults to true
	 */
	public set(error: T, value = true) {
		this.codes.set(error, value);
	}

	/**
	 * Gets the boolean value of the given error.
	 *
	 * @param error the error
	 * @returns true if the error has occurred, false otherwise
	 */
	public get(error: T): boolean {
		return this.codes.get(error) === true;
	}
}

/**
 * The possible errors the client of the api has to handle.
 */
export enum Errors {
	NETWORK,
	ABORTED,
	LARGE_FILE,
	USED_ANNOTATION_CLASS,
	USED_USER_NAME,
	SIMILAR_PASSWORD,
	COMMON_PASSWORD,
	INVALID_EMAIL,
	EXISTING_BASE_FILE,
	LOCKED,
	INVALID_CREDENTIALS,
	NO_ANNOTATION_FILE,
}
