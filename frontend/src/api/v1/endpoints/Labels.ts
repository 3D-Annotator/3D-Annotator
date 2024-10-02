import { type AxiosInstance } from "axios";
import { ResultAsync } from "neverthrow";
import {
	type APIResult,
	type APIResultAbort,
	type Labels,
	type NewLabel,
} from "~api/API";
import { Errors, SingularError } from "~api/Errors";
import {
	defaultApiValidationErrorHandler,
	getAbortErrorHandler,
	getNetworkErrorHandler,
} from "~api/v1/errors/ErrorHandler";
import { type LabelResource } from "~api/v1/resources/Resources";
import {
	transformArray,
	transformLabelResource,
} from "~api/v1/resources/Transformations";
import { validateString } from "~api/v1/validation/Validation";
import { type Color, type Label } from "~entity/Annotation";

const ENDPOINT = "labels/";

export class LabelsV1 implements Labels {
	private axios: AxiosInstance;

	constructor(axios: AxiosInstance) {
		this.axios = axios;
	}

	public list(
		projectId: number,
		abort?: AbortController
	): APIResultAbort<Label[]> {
		const config = {
			params: {
				project_id: projectId,
			},
			signal: abort?.signal,
		};

		const request = this.axios
			.get<LabelResource[]>(ENDPOINT, config)
			.then(({ data }) => transformArray(data, transformLabelResource));

		return ResultAsync.fromPromise(request, (error) =>
			getAbortErrorHandler().run(error)
		);
	}

	public add(
		label: NewLabel
	): APIResult<
		Label,
		SingularError<Errors.NETWORK | Errors.USED_ANNOTATION_CLASS>
	> {
		validateString(label.name, "label name", 100);

		const data = {
			project_id: label.projectId,
			annotationClass: label.annotationClass,
			name: label.name,
			color: label.color.asNumber(),
		};

		const request = this.axios
			.post<LabelResource>(ENDPOINT, data)
			.then(({ data }) => transformLabelResource(data));

		return ResultAsync.fromPromise(request, (error) =>
			getNetworkErrorHandler<
				SingularError<Errors.USED_ANNOTATION_CLASS>,
				typeof data
			>()
				.onAPIValidationError((apiError, axiosError) => {
					const errors = apiError.errors?.annotationClass;
					if (
						errors &&
						// spell-checker:disable-next-line
						errors[0].code === "annotationclass_not_unique"
					) {
						return new SingularError(Errors.USED_ANNOTATION_CLASS);
					}
					defaultApiValidationErrorHandler(apiError, axiosError);
				})
				.run(error)
		);
	}

	public detail(
		labelId: number,
		abort?: AbortController
	): APIResultAbort<Label> {
		const endpoint = this.getLabelEndpoint(labelId);

		const request = this.axios
			.get<LabelResource>(endpoint, { signal: abort?.signal })
			.then(({ data }) => transformLabelResource(data));

		return ResultAsync.fromPromise(request, (error) =>
			getNetworkErrorHandler().run(error)
		);
	}

	public update(
		labelId: number,
		name: string,
		color: Color
	): APIResult<Label> {
		validateString(name, "label name", 100);

		const endpoint = this.getLabelEndpoint(labelId);

		const request = this.axios
			.put<LabelResource>(endpoint, {
				name: name,
				color: color.asNumber(),
			})
			.then(({ data }) => transformLabelResource(data));

		return ResultAsync.fromPromise(request, (error) =>
			getNetworkErrorHandler().run(error)
		);
	}

	public delete(labelId: number): APIResult<void> {
		const endpoint = this.getLabelEndpoint(labelId);

		const request = this.axios.delete(endpoint).then(() => {
			return;
		});

		return ResultAsync.fromPromise(request, (error) =>
			getNetworkErrorHandler().run(error)
		);
	}

	private getLabelEndpoint(labelId: number) {
		return ENDPOINT + labelId + "/";
	}
}
