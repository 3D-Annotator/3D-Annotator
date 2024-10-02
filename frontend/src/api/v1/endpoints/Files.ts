import { type AxiosInstance } from "axios";
import { ResultAsync } from "neverthrow";
import { type APIResult, type APIResultAbort, type Files } from "~api/API";
import { Errors, SingularError } from "~api/Errors";
import {
	abortErrorHandler,
	defaultApiResponseErrorHandler,
	defaultApiValidationErrorHandler,
	getAbortErrorHandler,
	getNetworkErrorHandler,
} from "~api/v1/errors/ErrorHandler";
import {
	type APIResponseError,
	type APIValidationError,
	type AxiosResponseError,
} from "~api/v1/errors/ErrorTypes";
import { type FileResource } from "~api/v1/resources/Resources";
import { transformFileResource } from "~api/v1/resources/Transformations";
import { type FileInformation } from "~entity/ModelInformation";
import { type Observer } from "~entity/Types";
import {
	readableStreamAsBlob,
	type NamedStream,
} from "~util/streams/StreamUtils";
import { unzipStream, zipStream } from "~util/streams/ZIPUtils";

const ZIP_MIME_TYPE = "application/x-zip-compressed";

const ENDPOINT = "modelData/";
// ! Other than other endpoints, no slash at the end
const MODEL_ENDPOINT = "baseFile";
const ANNOTATION_ENDPOINT = "annotationFile";

const MODEL_FILE_NAME = "baseFile.zip";
const ANNOTATION_FILE_NAME = "annotationFile.zip";

const EMPTY_FILE = "empty";
const ANNOTATION_FILE = "annotation.anno3d";
const MAX_MODEL_FILES = 2;

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const TIMEOUT_DOWNLOAD = 30 * MINUTE;
const TIMEOUT_UPLOAD = 60 * MINUTE;

interface FileResponse {
	file: string;
}

export class FilesV1 implements Files {
	private axios: AxiosInstance;

	constructor(axios: AxiosInstance) {
		this.axios = axios;
	}

	/*
	 *  GENERIC UPLOAD/DOWNLOAD METHODS
	 */

	/**
	 * Downloads the data at the given endpoint.
	 *
	 * @param endpoint the endpoint
	 * @param onProgress an optional progress observer
	 * @returns a Promise resolving to the data as a blob
	 */
	private downloadBlob(
		endpoint: string,
		onProgress?: Observer<number>,
		abort?: AbortController
	): Promise<Blob> {
		const progressObserver = this.getProgressObserver(onProgress);
		return this.axios
			.get<Blob>(endpoint, {
				onDownloadProgress: progressObserver,
				responseType: "blob",
				signal: abort?.signal,
				timeout: TIMEOUT_DOWNLOAD,
			})
			.then(({ data }) => data);
	}

	private async unzipBlob(
		blob: Blob,
		expectedFileCount = 1
	): Promise<NamedStream[]> {
		return new Promise<NamedStream[]>((resolve) => {
			const stream = blob.stream();

			const resStreams: NamedStream[] = [];
			let count = 0;

			function onNewFile(namedStream: NamedStream) {
				const newStream = namedStream.stream;
				const streamName = namedStream.name;

				if (streamName !== EMPTY_FILE) {
					resStreams.push({
						name: streamName,
						stream: newStream,
					});
				}

				count++;

				if (count === expectedFileCount) {
					resolve(resStreams);
				}
			}

			unzipStream(stream, onNewFile);
		});
	}

	/**
	 * Uploads a ZIP file to the given endpoint.
	 *
	 * @param endpoint  the endpoint
	 * @param fileStream stream streaming the file's content
	 * @param fileName a custom file name, default is the file's name
	 * @param onProgress an optional progress observer
	 * @returns the file information response by the server
	 * @throws if the file is not a ZIP file
	 */
	private async uploadStream(
		endpoint: string,
		fileStream: ReadableStream<Uint8Array>,
		fileName: string,
		onProgress?: Observer<number>,
		abort?: AbortController
	): Promise<FileInformation> {
		const progressObserver = this.getProgressObserver(onProgress);

		const blob = await readableStreamAsBlob(fileStream);
		const formData = new FormData();
		formData.append("fileFormat", ZIP_MIME_TYPE);
		formData.append("file", blob, fileName);

		return this.axios
			.put<FileResource>(endpoint, formData, {
				onUploadProgress: progressObserver,
				headers: {
					"Content-Type": "multipart/form-data",
				},
				signal: abort?.signal,
				timeout: TIMEOUT_UPLOAD,
			})
			.then(({ data }) => transformFileResource(data));
	}

	/*
	 *  PUBLIC UPLOAD/DOWNLOAD METHODS
	 */

	public downloadModel(
		modelId: number,
		onProgress?: Observer<number>,
		abort?: AbortController
	): APIResultAbort<NamedStream[]> {
		const request = this.downloadModelHelper(modelId, onProgress, abort);

		return ResultAsync.fromPromise(request, (error) =>
			getAbortErrorHandler().run(error)
		);
	}

	private async downloadModelHelper(
		modelId: number,
		onProgress?: Observer<number>,
		abort?: AbortController
	): Promise<NamedStream[]> {
		const endpoint = this.getEndpoint(modelId, MODEL_ENDPOINT);
		const blob = await this.downloadBlob(endpoint, onProgress, abort);
		const files = await this.unzipBlob(blob, MAX_MODEL_FILES);
		return files;
	}

	public uploadModel(
		modelId: number,
		fileStreams: NamedStream[],
		onProgress?: Observer<number>
	): APIResult<
		FileInformation,
		SingularError<
			Errors.NETWORK | Errors.LARGE_FILE | Errors.EXISTING_BASE_FILE
		>
	> {
		if (fileStreams.length > MAX_MODEL_FILES) {
			throw new Error(
				`Not more than ${MAX_MODEL_FILES} files supported.`
			);
		}

		if (fileStreams.length === 1) {
			fileStreams = [...fileStreams];
			fileStreams.push({
				name: EMPTY_FILE,
				stream: new Blob([EMPTY_FILE]).stream(),
			});
		}

		const endpoint = this.getEndpoint(modelId, MODEL_ENDPOINT);
		const zipFileStream = zipStream(fileStreams);
		const request = this.uploadStream(
			endpoint,
			zipFileStream,
			MODEL_FILE_NAME,
			onProgress
		);

		const errorHandler = getNetworkErrorHandler<
			SingularError<Errors.LARGE_FILE | Errors.EXISTING_BASE_FILE>,
			FileResponse
		>()
			.onAPIResponseError(this.baseFileAlreadyExistsErrorHandler)
			.onAPIValidationError(this.fileValidationErrorHandler);

		return ResultAsync.fromPromise(request, (error) =>
			errorHandler.run(error)
		);
	}

	public downloadAnnotationFile(
		modelId: number,
		onProgress?: Observer<number>,
		abort?: AbortController
	): APIResult<
		ReadableStream<Uint8Array>,
		SingularError<
			Errors.NETWORK | Errors.ABORTED | Errors.NO_ANNOTATION_FILE
		>
	> {
		const request = this.downloadAnnotationFileHelper(
			modelId,
			onProgress,
			abort
		);

		const errorHandler = getNetworkErrorHandler<
			SingularError<Errors.NO_ANNOTATION_FILE | Errors.ABORTED>
		>()
			.onAxiosSetupError(abortErrorHandler)
			.onAPIResponseError(this.noAnnotationFileErrorHandler);

		return ResultAsync.fromPromise(request, (error) =>
			errorHandler.run(error)
		);
	}

	private async downloadAnnotationFileHelper(
		modelId: number,
		onProgress?: Observer<number>,
		abort?: AbortController
	): Promise<ReadableStream<Uint8Array>> {
		const endpoint = this.getEndpoint(modelId, ANNOTATION_ENDPOINT);
		const blob = await this.downloadBlob(endpoint, onProgress, abort);
		const [annotationFile] = await this.unzipBlob(blob);
		return annotationFile.stream;
	}

	public uploadAnnotationFile(
		modelId: number,
		fileStream: ReadableStream<Uint8Array>,
		onProgress?: Observer<number>
	): APIResult<
		FileInformation,
		SingularError<Errors.NETWORK | Errors.LOCKED | Errors.LARGE_FILE>
	> {
		const endpoint = this.getEndpoint(modelId, ANNOTATION_ENDPOINT);
		const zipFileStream = zipStream([
			{ name: ANNOTATION_FILE, stream: fileStream },
		]);
		const request = this.uploadStream(
			endpoint,
			zipFileStream,
			ANNOTATION_FILE_NAME,
			onProgress
		);

		const errorHandler = getNetworkErrorHandler<
			SingularError<Errors.LARGE_FILE | Errors.LOCKED>,
			FileResponse
		>()
			.onAPIResponseError(this.lockedAnnotationFileErrorHandler)
			.onAPIValidationError(this.fileValidationErrorHandler);

		return ResultAsync.fromPromise(request, (error) =>
			errorHandler.run(error)
		);
	}

	/*
	 *  ERROR HANDLERS
	 */

	private baseFileAlreadyExistsErrorHandler(
		this: void,
		apiError: APIResponseError,
		axiosError: AxiosResponseError
	): SingularError<Errors.EXISTING_BASE_FILE> {
		if (
			apiError.status === 403 &&
			// spell-checker:disable-next-line
			apiError.code === "basefile_already_exists"
		) {
			return new SingularError(Errors.EXISTING_BASE_FILE);
		} else {
			defaultApiResponseErrorHandler(apiError, axiosError);
		}
	}

	private noAnnotationFileErrorHandler(
		this: void,
		apiError: APIResponseError,
		axiosError: AxiosResponseError
	): SingularError<Errors.NO_ANNOTATION_FILE> {
		if (apiError.status === 404) {
			return new SingularError(Errors.NO_ANNOTATION_FILE);
		} else {
			defaultApiResponseErrorHandler(apiError, axiosError);
		}
	}

	private lockedAnnotationFileErrorHandler(
		this: void,
		apiError: APIResponseError,
		axiosError: AxiosResponseError
	): SingularError<Errors.LOCKED> {
		// spell-checker:disable-next-line
		if (apiError.status === 403 && apiError.code === "modeldata_locked") {
			return new SingularError(Errors.LOCKED);
		} else {
			defaultApiResponseErrorHandler(apiError, axiosError);
		}
	}

	private fileValidationErrorHandler(
		this: void,
		apiError: APIValidationError<FileResponse>,
		axiosError: AxiosResponseError
	): SingularError<Errors.LARGE_FILE> {
		const validationErrors = apiError.errors;

		let returnError;
		if (validationErrors?.file) {
			for (const error of validationErrors.file) {
				if (error.code === "too_large") {
					returnError = new SingularError(Errors.LARGE_FILE);
				}
			}
		}

		if (returnError) {
			return returnError;
		} else {
			defaultApiValidationErrorHandler(apiError, axiosError);
		}
	}

	/*
	 *  HELPER METHODS
	 */

	private getEndpoint(modelId: number, fileEndpoint: string) {
		return ENDPOINT + modelId + "/" + fileEndpoint;
	}

	private getProgressObserver(
		onProgress?: Observer<number>
	): Observer<ProgressEvent> | undefined {
		let progressObserver;
		if (onProgress) {
			progressObserver = (progress: ProgressEvent) => {
				const percentage = (progress.loaded / progress.total) * 100;
				onProgress(percentage);
			};
		}
		return progressObserver;
	}
}
