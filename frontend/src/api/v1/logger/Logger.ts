import {
	type AxiosError,
	type AxiosRequestConfig,
	type AxiosResponse,
} from "axios";
import { ENV } from "env";
import { PREFIX } from "~api/v1/APIv1";
import { emptyErrorHandler } from "~api/v1/errors/ErrorHandler";
import {
	type APIResponseError,
	type APIValidationError,
	type AxiosRequestError,
	type AxiosResponseError,
} from "~api/v1/errors/ErrorTypes";
import { type FullUser } from "~entity/User";
import { date, dirGroup, logJSON, logJSONGroup } from "./ConsoleLogUtils";

const DEBUG = ENV.ANNOTATOR_3D_DEBUG;

/*
 *   +++ AUTH STATE +++
 */

export function authStateLogger(
	user: FullUser | null,
	token: string | null,
	expiry: Date | null
) {
	console.groupCollapsed(`%c${PREFIX}AUTH STATE CHANGED`, "color:orange;");
	if (user) {
		logJSON({ token: token, expiry: expiry, user: user });
	} else {
		console.log(null);
	}
	console.groupEnd();
}

/*
 *   +++ REQUESTS +++
 */

export function requestLogger(config: AxiosRequestConfig): AxiosRequestConfig {
	if (DEBUG) {
		const method = config.method?.toUpperCase();
		const url = config.url;
		console.groupCollapsed(
			`${PREFIX}${method} request to ${url} at ${date()}`
		);
		dirGroup("headers", config.headers);
		dirGroup("params", config.params as object);
		dirGroup("data", config.data as object);
		dirGroup("entire config", config);
		console.groupEnd();
	}
	return config;
}

export function requestErrorLogger(error: object): Promise<void> {
	if (DEBUG) {
		console.groupCollapsed(
			`%c${PREFIX}Request error at ${date()}`,
			"color: red;"
		);
		console.dir(error);
		console.groupEnd();
	}

	return Promise.reject(error);
}

/*
 *   +++ RESPONSES +++
 */

export function responseLogger(response: AxiosResponse): AxiosResponse {
	if (DEBUG) {
		const method = response.config.method?.toUpperCase();
		const url = response.config.url;
		console.groupCollapsed(
			`%c${PREFIX}${response.status} (${
				response.statusText
			}) response from ${method} ${url} at ${date()}`,
			"color: green;"
		);
		logJSONGroup("request headers", response.config.headers);
		logJSONGroup("response headers", response.headers);
		logJSONGroup("data", response.data as object);
		dirGroup("config", response.config);
		console.groupEnd();
	}

	return response;
}

export function responseErrorLogger(error: object): Promise<void> {
	if (!DEBUG) {
		return Promise.reject(error);
	}

	const handler = emptyErrorHandler()
		.onNonAxiosError((error) => {
			handleNonAxiosError(error);
			return Promise.reject(error);
		})
		.onAxiosSetupError((error) => {
			handleAxiosSetupError(error);
			return Promise.reject(error);
		})
		.onAxiosRequestError((error) => {
			handleAxiosRequestError(error);
			return Promise.reject(error);
		})
		.onAxiosResponseError((error) => {
			handleAxiosResponseError(error);
			return Promise.reject(error);
		})
		.onAPIResponseError((apiError, error) => {
			handleAPIResponseError(apiError, error);
			return Promise.reject(error);
		})
		.onAPIValidationError((apiError, error) => {
			handleAPIValidationError(apiError, error);
			return Promise.reject(error);
		})
		.onBlobError((blob, error) => {
			handleBlobError(blob, error);
			return Promise.reject(error);
		});

	return handler.run(error);
}

/*
 *   +++ RESPONSE ERROR HANDLERS +++
 */

function handleNonAxiosError(error: unknown) {
	console.groupCollapsed(
		`%c${PREFIX}Unknown non-axios error at ${date()}`,
		"color: red;"
	);
	if (error) {
		console.dir(error);
	} else {
		console.log(error);
	}
	console.groupEnd();
}

function handleAxiosSetupError(error: AxiosError) {
	console.groupCollapsed(
		`%c${PREFIX}Axios setup error "${error.code}" at ${date()}: ${
			error.message
		}`,
		"color: red;"
	);
	// ! AxiosError type is wrong
	if (error.config) {
		dirGroup("config", error.config);
	}

	console.groupEnd();
}

function handleAxiosRequestError(error: AxiosRequestError) {
	console.groupCollapsed(
		`%c${PREFIX}Request error "${error.code}" at ${date()}: ${
			error.message
		}`,
		"color: red;"
	);
	dirGroup("request", error.request as object);
	dirGroup("config", error.config);
	dirGroup("error", error);
	console.groupEnd();
}

function handleAxiosResponseError(error: AxiosResponseError) {
	console.log(error);
	const method = error.config.method?.toUpperCase();
	const url = error.response.config.url;
	console.groupCollapsed(
		`%c${PREFIX}${error.response.status} (${
			error.response.statusText
		}, AxiosResponseError) response from ${method} ${url} at ${date()}`,
		"color: red;"
	);
	logJSONGroup("request headers", error.response.config.headers);
	logJSONGroup("response headers", error.response.headers);
	logJSONGroup("data", error.response.data as object, false);
	dirGroup("config", error.response.config);
	dirGroup("axios error", error);
	console.groupEnd();
}

function handleAPIResponseError(
	apiError: APIResponseError,
	error: AxiosResponseError
) {
	const method = error.response.config.method?.toUpperCase();
	const url = error.response.config.url;
	console.groupCollapsed(
		`%c${PREFIX}${error.response.status} (${
			error.response.statusText
		}, APIResponseError) response from ${method} ${url} at ${date()}`,
		"color: red;"
	);
	logJSONGroup("request headers", error.response.config.headers);
	logJSONGroup("response headers", error.response.headers);
	logJSONGroup("API Error", apiError, false);
	dirGroup("config", error.response.config);
	dirGroup("axios error", error);
	console.groupEnd();
}

function handleAPIValidationError(
	apiError: APIValidationError<object>,
	error: AxiosResponseError
) {
	const method = error.response.config.method?.toUpperCase();
	const url = error.response.config.url;
	console.groupCollapsed(
		`%c${PREFIX}${error.response.status} (${
			error.response.statusText
		}, APIValidationError)) response from ${method} ${url} at ${date()}`,
		"color: red;"
	);
	logJSONGroup("request headers", error.response.config.headers);
	logJSONGroup("response headers", error.response.headers);
	logJSONGroup("API Validation Error", apiError.errors, false);
	dirGroup("config", error.response.config);
	dirGroup("axios error", error);
	console.groupEnd();
}

function handleBlobError(blob: Blob, error: AxiosResponseError) {
	const method = error.response.config.method?.toUpperCase();
	const url = error.response.config.url;
	console.groupCollapsed(
		`%c${PREFIX}${error.response.status} (${
			error.response.statusText
		}, BlobError)) response from ${method} ${url} at ${date()}`,
		"color: red;"
	);
	logJSONGroup("request headers", error.response.config.headers);
	logJSONGroup("response headers", error.response.headers);
	dirGroup("blob", blob);
	dirGroup("config", error.response.config);
	dirGroup("axios error", error);
	console.groupEnd();
}
