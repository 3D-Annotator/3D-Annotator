import axios, { type AxiosError } from "axios";
import { Errors, SingularError } from "~api/Errors";
import { PREFIX } from "~api/v1/APIv1";
import {
	isAPIResponseErrorData,
	isAPIValidationErrorData,
	isAxiosRequestError,
	isAxiosResponseError,
	type APIResponseError,
	type APIValidationError,
	type AxiosRequestError,
	type AxiosResponseError,
} from "./ErrorTypes";

console.info(
	"As chrome does not display the 'cause' field of errors yet, some uncaught errors may be additionally logged using console.error(error, cause).\nFor more info see: https://bugs.chromium.org/p/chromium/issues/detail?id=1211260#c1."
);

export type NonAxiosErrorHandler<R> = (error: unknown) => R;

export type AxiosSetupErrorHandler<R> = (error: AxiosError) => R;

export type NetworkErrorHandler<R> = (error: AxiosRequestError) => R;

export type AxiosRequestErrorHandler<R> = (error: AxiosRequestError) => R;

export type AxiosResponseErrorHandler<R> = (error: AxiosResponseError) => R;

export type APIResponseErrorHandler<R> = (
	apiError: APIResponseError,
	error: AxiosResponseError
) => R;

export type APIValidationErrorHandler<R, T> = (
	apiError: APIValidationError<T>,
	error: AxiosResponseError
) => R;

export type BlobErrorHandler<R> = (blob: Blob, error: AxiosResponseError) => R;

/**
 * A generic error handler for requests to our api using axios.
 *
 * Objects of this class must be configured with an error handler
 * for each of the six different error stages:
 *  - non axios error: Error that could not be identified
 *  - axios setup error: Error while setting up axios
 *  - axios request error: Error while creating the request (e.g. illegal config)
 *  - axios response error: A response with status != 200 but with an unknown body
 *  - api response error: An error thrown by the server in the expected format
 *    (see ErrorTypes.ts)
 *  - api validation error: An error caused by invalid fields in the request data.
 *    Each field has a own error code and message.
 *
 * As missing handlers lead to runtime errors, all handlers should be set immediately
 * after calling the constructor. All builder methods support method chaining exactly
 * for this reason.
 *
 * @example
 *
 * const handler = new ErrorHandler<Result, ValidationTypes>()
 *    .onNonAxiosError(...)
 *    .onAxiosSetupError(...)
 *    // ...
 *   .onAPIValidationError(...);
 *
 */
export class ErrorHandler<R, T = object> {
	private nonAxiosErrorHandler!: NonAxiosErrorHandler<R>;
	private axiosSetupErrorHandler!: AxiosSetupErrorHandler<R>;
	private networkErrorHandler!: NetworkErrorHandler<R>;
	private axiosRequestErrorHandler!: AxiosRequestErrorHandler<R>;
	private axiosResponseErrorHandler!: AxiosResponseErrorHandler<R>;
	private apiResponseErrorHandler!: APIResponseErrorHandler<R>;
	private apiValidationErrorHandler!: APIValidationErrorHandler<R, T>;
	private blobErrorHandler!: BlobErrorHandler<R>;

	public onNonAxiosError(handler: NonAxiosErrorHandler<R>): this {
		this.nonAxiosErrorHandler = handler;
		return this;
	}

	public onAxiosSetupError(handler: AxiosSetupErrorHandler<R>): this {
		this.axiosSetupErrorHandler = handler;
		return this;
	}

	public onNetworkError(handler: NetworkErrorHandler<R>): this {
		this.networkErrorHandler = handler;
		return this;
	}

	public onAxiosRequestError(handler: AxiosRequestErrorHandler<R>): this {
		this.axiosRequestErrorHandler = handler;
		return this;
	}

	public onAxiosResponseError(handler: AxiosResponseErrorHandler<R>): this {
		this.axiosResponseErrorHandler = handler;
		return this;
	}

	public onAPIResponseError(handler: APIResponseErrorHandler<R>): this {
		this.apiResponseErrorHandler = handler;
		return this;
	}

	public onAPIValidationError(
		handler: APIValidationErrorHandler<R, T>
	): this {
		this.apiValidationErrorHandler = handler;
		return this;
	}

	public onBlobError(handler: BlobErrorHandler<R>): this {
		this.blobErrorHandler = handler;
		return this;
	}

	public run(error: unknown): R {
		if (!axios.isAxiosError(error)) {
			return this.nonAxiosErrorHandler(error);
		} else if (isAxiosResponseError(error)) {
			const status = error.response.status;
			const resData = error.response.data as unknown;

			if (resData instanceof Blob) {
				return this.blobErrorHandler(resData, error);
			}

			if (isAPIValidationErrorData<T>(resData)) {
				return this.apiValidationErrorHandler(
					{ errors: resData.errors },
					error
				);
			} else if (isAPIResponseErrorData(resData)) {
				return this.apiResponseErrorHandler(
					{
						status: status,
						code: resData.code,
						message: resData.message,
					},
					error
				);
			} else {
				return this.axiosResponseErrorHandler(error);
			}
		} else if (isAxiosRequestError(error)) {
			if (error.code === "ERR_NETWORK") {
				return this.networkErrorHandler(error);
			}
			return this.axiosRequestErrorHandler(error);
		} else {
			return this.axiosSetupErrorHandler(error);
		}
	}
}

/*
 *   +++ DEFAULT ERROR HANDLERS  +++
 */

export function getDefaultErrorHandler<R = never, T = object>(): ErrorHandler<
	R,
	T
> {
	return new ErrorHandler<R, T>()
		.onNonAxiosError(defaultNonAxiosErrorHandler)
		.onAxiosSetupError(defaultAxiosSetupErrorHandler)
		.onNetworkError(defaultNetworkErrorHandler)
		.onAxiosRequestError(defaultAxiosRequestErrorHandler)
		.onAxiosResponseError(defaultAxiosResponseErrorHandler)
		.onAPIResponseError(defaultApiResponseErrorHandler)
		.onAPIValidationError(defaultApiValidationErrorHandler)
		.onBlobError(defaultBlobErrorHandler);
}

/**
 * Creates a new ErrorHandler with default methods.
 * The default methods accept the typed errors and rethrow them.
 * Every error stage can be overwritten using the methods of
 *
 * @returns a new ErrorHandler with the defaults.
 */
export function getNetworkErrorHandler<R = never, T = object>(): ErrorHandler<
	R | SingularError<Errors.NETWORK>,
	T
> {
	return new ErrorHandler<R | SingularError<Errors.NETWORK>, T>()
		.onNonAxiosError(defaultNonAxiosErrorHandler)
		.onAxiosSetupError(defaultAxiosSetupErrorHandler)
		.onNetworkError(singularErrorNetworkErrorHandler)
		.onAxiosRequestError(defaultAxiosRequestErrorHandler)
		.onAxiosResponseError(defaultAxiosResponseErrorHandler)
		.onAPIResponseError(defaultApiResponseErrorHandler)
		.onAPIValidationError(defaultApiValidationErrorHandler)
		.onBlobError(defaultBlobErrorHandler);
}

export function getAbortErrorHandler(): ErrorHandler<
	SingularError<Errors.ABORTED | Errors.NETWORK>
> {
	return new ErrorHandler<SingularError<Errors.ABORTED | Errors.NETWORK>>()
		.onNonAxiosError(defaultNonAxiosErrorHandler)
		.onAxiosSetupError(abortErrorHandler)
		.onNetworkError(singularErrorNetworkErrorHandler)
		.onAxiosRequestError(defaultAxiosRequestErrorHandler)
		.onAxiosResponseError(defaultAxiosResponseErrorHandler)
		.onAPIResponseError(defaultApiResponseErrorHandler)
		.onAPIValidationError(defaultApiValidationErrorHandler)
		.onBlobError(defaultBlobErrorHandler);
}

export function abortErrorHandler(
	error: AxiosError
): SingularError<Errors.ABORTED> | never {
	if (error.code === "ERR_CANCELED") {
		return new SingularError(Errors.ABORTED);
	}
	defaultAxiosSetupErrorHandler(error);
}

export function defaultNonAxiosErrorHandler(error: unknown): never {
	if (error instanceof Error) {
		throw error;
	} else {
		throw new Error("Unexpected non-axios error: " + String(error));
	}
}

export function defaultAxiosSetupErrorHandler(error: AxiosError): never {
	throw getError("Unexpected axios setup error.", error);
}

export function defaultNetworkErrorHandler(error: AxiosRequestError): never {
	throw getError("Unexpected network error.", error);
}

export function singularErrorNetworkErrorHandler(): SingularError<Errors.NETWORK> {
	return new SingularError(Errors.NETWORK);
}

export function defaultAxiosRequestErrorHandler(
	error: AxiosRequestError
): never {
	throw getError("Unexpected axios request error.", error);
}

export function defaultAxiosResponseErrorHandler(
	error: AxiosResponseError
): never {
	throw getError("Unexpected axios response error.", error);
}

export function defaultApiResponseErrorHandler(
	apiError: APIResponseError,
	error: AxiosResponseError
): never {
	error.apiResponseData = apiError;
	if (apiError.status === 401 && apiError.code === "not_logged_in") {
		throw getError(
			"Not signed in anymore. The token is expired or invalid.",
			error
		);
	} else {
		throw getError("Unexpected api response error.", error);
	}
}

export function defaultApiValidationErrorHandler<T>(
	apiError: APIValidationError<T>,
	error: AxiosResponseError
): never {
	error.apiResponseData = apiError;
	throw getError("Unexpected api validation error", error);
}

export function defaultBlobErrorHandler(
	blob: Blob,
	error: AxiosResponseError
): never {
	throw getError("Unexpected blob error", error);
}

export function getError(text: string, error: Error): Error {
	const newError = new Error(`${PREFIX}${text}`, {
		cause: error,
	});
	console.error(newError, newError.cause);
	return newError;
}

export function emptyErrorHandler(): ErrorHandler<Promise<never>> {
	return new ErrorHandler<Promise<never>>()
		.onNonAxiosError((error) => Promise.reject(error))
		.onAxiosSetupError((error) => Promise.reject(error))
		.onNetworkError((error) => Promise.reject(error))
		.onAxiosRequestError((error) => Promise.reject(error))
		.onAxiosResponseError((error) => Promise.reject(error))
		.onAPIResponseError((_, error) => Promise.reject(error))
		.onAPIValidationError((_, error) => Promise.reject(error))
		.onBlobError((blob, error) => Promise.reject(error));
}

export async function convertBlobData<T>(error: unknown): Promise<T> {
	if (
		axios.isAxiosError(error) &&
		isAxiosResponseError(error) &&
		error.response.data instanceof Blob
	) {
		const text = await error.response.data.text();
		let object: unknown;
		try {
			object = JSON.parse(text);
			error.response.data = object;
		} catch (jsonError) {
			error.response.data = text;
		}
	}
	return Promise.reject(error);
}
