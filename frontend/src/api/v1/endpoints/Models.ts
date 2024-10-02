import { type AxiosInstance } from "axios";
import { ResultAsync } from "neverthrow";
import {
	type APIResult,
	type APIResultAbort,
	type Models,
	type NewModelInformation,
} from "~api/API";
import { Errors, SingularError } from "~api/Errors";
import {
	defaultApiResponseErrorHandler,
	getAbortErrorHandler,
	getNetworkErrorHandler,
} from "~api/v1/errors/ErrorHandler";
import { type ModelDataResource } from "~api/v1/resources/Resources";
import {
	transformArray,
	transformModelDataResource,
} from "~api/v1/resources/Transformations";
import { validateString } from "~api/v1/validation/Validation";
import { type ModelInformation } from "~entity/ModelInformation";

const ENDPOINT = "modelData/";
const ENDPOINT_LOCK = "lock/";

export class ModelsV1 implements Models {
	private axios: AxiosInstance;

	constructor(axios: AxiosInstance) {
		this.axios = axios;
	}

	list(
		projectId: number,
		abort?: AbortController
	): APIResultAbort<ModelInformation[]> {
		const config = {
			params: {
				project_id: projectId,
			},
			signal: abort?.signal,
		};

		const request = this.axios
			.get<ModelDataResource[]>(ENDPOINT, config)
			.then(({ data }) =>
				transformArray(data, transformModelDataResource)
			);

		return ResultAsync.fromPromise(request, (error) =>
			getAbortErrorHandler().run(error)
		);
	}

	public add(
		modelInformation: NewModelInformation
	): APIResult<ModelInformation> {
		validateString(modelInformation.name, "model information name", 100);

		const data = {
			project_id: modelInformation.projectId,
			name: modelInformation.name,
			modelType: modelInformation.modelType,
			annotationType: "index",
		};

		const request = this.axios
			.post<ModelDataResource>(ENDPOINT, data)
			.then(({ data }) => transformModelDataResource(data));

		return ResultAsync.fromPromise(request, (error) =>
			getNetworkErrorHandler().run(error)
		);
	}

	public detail(
		modelId: number,
		abort?: AbortController
	): APIResultAbort<ModelInformation> {
		const endpoint = this.getModelDataEndpoint(modelId);

		const request = this.axios
			.get<ModelDataResource>(endpoint, { signal: abort?.signal })
			.then(({ data }) => transformModelDataResource(data));

		return ResultAsync.fromPromise(request, (error) =>
			getAbortErrorHandler().run(error)
		);
	}

	public update(modelId: number, name: string): APIResult<ModelInformation> {
		validateString(name, "model information name", 100);

		const endpoint = this.getModelDataEndpoint(modelId);

		const request = this.axios
			.put<ModelDataResource>(endpoint, { name: name })
			.then(({ data }) => transformModelDataResource(data));

		return ResultAsync.fromPromise(request, (error) =>
			getNetworkErrorHandler().run(error)
		);
	}

	public delete(modelId: number): APIResult<void> {
		const endpoint = this.getModelDataEndpoint(modelId);

		const request = this.axios.delete(endpoint).then(() => {
			return;
		});

		return ResultAsync.fromPromise(request, (error) =>
			getNetworkErrorHandler().run(error)
		);
	}

	public lock(
		modelId: number,
		lock: boolean
	): APIResult<void, SingularError<Errors.NETWORK | Errors.LOCKED>> {
		const endpoint = this.getLockModelDataEndpoint(modelId);

		const request = this.axios
			.put<void>(endpoint, { lock: lock })
			.then(() => {
				return;
			});

		const errorHandler = getNetworkErrorHandler<
			SingularError<Errors.NETWORK | Errors.LOCKED>
		>().onAPIResponseError((apiError, error) => {
			if (
				apiError.status === 403 &&
				// spell-checker:disable-next-line
				apiError.code === "modeldata_locked"
			) {
				return new SingularError(Errors.LOCKED);
			}
			defaultApiResponseErrorHandler(apiError, error);
		});

		return ResultAsync.fromPromise(request, (error) =>
			errorHandler.run(error)
		);
	}

	private getModelDataEndpoint(modelDataId: number) {
		return ENDPOINT + modelDataId + "/";
	}

	private getLockModelDataEndpoint(modelDataId: number) {
		return this.getModelDataEndpoint(modelDataId) + ENDPOINT_LOCK;
	}
}
