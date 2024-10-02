import { type AxiosInstance } from "axios";
import { ResultAsync } from "neverthrow";
import { type APIResultAbort, type Users } from "~api/API";
import { getAbortErrorHandler } from "~api/v1/errors/ErrorHandler";
import { type UserResource } from "~api/v1/resources/Resources";
import {
	transformArray,
	transformUserResource,
} from "~api/v1/resources/Transformations";
import { type User } from "~entity/User";

export class UsersV1 implements Users {
	private axios: AxiosInstance;

	constructor(axios: AxiosInstance) {
		this.axios = axios;
	}

	public list(abort?: AbortController): APIResultAbort<User[]> {
		const endpoint = "users/";

		const request = this.axios
			.get<UserResource[]>(endpoint, {
				signal: abort?.signal,
			})
			.then(({ data }) => {
				return transformArray(data, transformUserResource);
			});

		return ResultAsync.fromPromise(request, (error) =>
			getAbortErrorHandler().run(error)
		);
	}
}
