/**
 * Checks if the given string value is longer than maxLength or shorter than minLength.
 * If the string is invalid, an error is thrown.
 *
 * @param value the string to be checked
 * @param name the name of the string for the error message
 * @param maxLength the max length of the string
 * @param minLength the min length of the string (default = 1, i.e. not empty)
 */
export function validateString(
	value: string,
	name: string,
	maxLength: number,
	minLength = 1
) {
	if (value.length > maxLength) {
		throw new Error(`${name} is too long (max length: ${maxLength})`);
	}

	if (minLength && value.length < minLength) {
		throw new Error(`${name} is too short (min length: ${minLength})`);
	}
}

export function validateNonNumericString(value: string, name: string) {
	if (value.match(/^[0-9]+$/)) {
		throw new Error(`${name} is entirely numeric`);
	}
}
