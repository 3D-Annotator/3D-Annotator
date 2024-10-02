import { type AxiosError, type AxiosResponse } from "axios";
import { type OptionalNestedObject } from "~entity/Types";

/**
 *	*** API ***
 */

// ERROR INFO

export interface APIErrorInfo {
	code: string;
	message: string;
}

export function isAPIErrorInfo(data: unknown): data is APIErrorInfo {
	if (!data || typeof data != "object") {
		return false;
	}

	if (!("code" in data) || !("message" in data)) {
		return false;
	}

	return typeof data.code === "string" && typeof data.message === "string";
}

// RESPONSE ERROR

export interface APIResponseError {
	status: number;
	code: string;
	message: string;
}

export interface APIResponseErrorData extends APIErrorInfo {
	containsErrorList: boolean;
}

export function isAPIResponseErrorData(
	data: unknown
): data is APIResponseErrorData {
	if (!isAPIErrorInfo(data)) {
		return false;
	}

	if (!("containsErrorList" in data)) {
		return false;
	}

	return (
		typeof data.code === "string" &&
		typeof data.message === "string" &&
		typeof data.containsErrorList === "boolean"
	);
}

// VALIDATION  ERROR

export interface APIValidationError<T> {
	errors: OptionalNestedObject<T, APIErrorInfo[]>;
}

export interface APIValidationErrorData<T> extends APIResponseErrorData {
	errors: OptionalNestedObject<T, APIErrorInfo[]>;
}

export function isAPIValidationErrorData<T>(
	data: unknown
): data is APIValidationErrorData<T> {
	return isAPIResponseErrorData(data) && data.containsErrorList;
}

/**
 *	*** AXIOS ***
 */

// AXIOS REQUEST ERROR

export interface AxiosRequestError extends AxiosError {
	request: unknown;
}

export function isAxiosRequestError(
	data: AxiosError
): data is AxiosRequestError {
	return data.request !== undefined;
}

// AXIOS RESPONSE ERROR

export interface AxiosResponseError extends AxiosError {
	response: AxiosResponse;
	apiResponseData?: APIResponseError | APIValidationError<unknown>;
}

export function isAxiosResponseError(
	error: AxiosError
): error is AxiosResponseError {
	/*
	 * The second check is necessary because of a bug in the axios typescript types.
	 * See: https://github.com/axios/axios/issues/4920
	 */
	//
	return error.response?.config !== undefined;
}
