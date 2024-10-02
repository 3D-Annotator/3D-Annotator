import { type AxiosInstance } from "axios";
import { ENV } from "env";
import { ResultAsync } from "neverthrow";
import {
	type APIResult,
	type APIResultAbort,
	type ProjectData,
	type Projects,
} from "~api/API";
import {
	getAbortErrorHandler,
	getNetworkErrorHandler,
} from "~api/v1/errors/ErrorHandler";
import {
	type FullProjectResource,
	type ProjectResource,
	type UserResource,
} from "~api/v1/resources/Resources";
import {
	transformArray,
	transformFullProjectResource,
	transformProjectResource,
	transformUserResource,
} from "~api/v1/resources/Transformations";
import { validateString } from "~api/v1/validation/Validation";
import { type FullProject, type Project } from "~entity/Project";
import { type User } from "~entity/User";

const DEBUG = ENV.ANNOTATOR_3D_DEBUG;

const ENDPOINT = "projects/";
const ENDPOINT_MEMBER = "users/";

export class ProjectsV1 implements Projects {
	private axios: AxiosInstance;

	constructor(axios: AxiosInstance) {
		this.axios = axios;
	}

	public list(
		userId: number,
		abort?: AbortController
	): APIResultAbort<Project[]> {
		const config = {
			params: {
				user_id: userId,
			},
			signal: abort?.signal,
		};

		const request = this.axios
			.get<ProjectResource[]>(ENDPOINT, config)
			.then(({ data }) => transformArray(data, transformProjectResource))
			.then((projects) => {
				//! HOTFIX: Sometimes the api returns the same projects twice.
				// Using a naive algorithm with quadratic time complexity to filter the
				// projects as the number of projects is usually rather small.
				return projects.filter((project, index, self) => {
					const isDuplicate =
						index !==
						self.findIndex((tmp) => project.id === tmp.id);
					if (DEBUG && isDuplicate) {
						console.log(
							`CAUTION: The project with the id '${project.id}' was returned more than once!`
						);
					}
					return !isDuplicate;
				});
			});

		return ResultAsync.fromPromise(request, (error) =>
			getAbortErrorHandler().run(error)
		);
	}

	public add(project: ProjectData): APIResult<Project> {
		validateString(project.name, "project name", 150);
		validateString(project.description, "project description", 255);

		const request = this.axios
			.post<FullProjectResource>(ENDPOINT, project)
			.then(({ data }) => transformFullProjectResource(data));

		return ResultAsync.fromPromise(request, (error) =>
			getNetworkErrorHandler().run(error)
		);
	}

	public detail(
		projectId: number,
		abort?: AbortController
	): APIResultAbort<FullProject> {
		const endpoint = this.getProjectEndpoint(projectId);

		const request = this.axios
			.get<FullProjectResource>(endpoint, {
				signal: abort?.signal,
			})
			.then(({ data }) => transformFullProjectResource(data));

		return ResultAsync.fromPromise(request, (error) =>
			getAbortErrorHandler().run(error)
		);
	}

	public update(
		projectId: number,
		project: ProjectData
	): APIResult<FullProject> {
		validateString(project.name, "project name", 150);
		validateString(project.description, "project description", 255);

		const endpoint = this.getProjectEndpoint(projectId);

		const request = this.axios
			.put<FullProjectResource>(endpoint, project)
			.then(({ data }) => transformFullProjectResource(data));

		return ResultAsync.fromPromise(request, (error) =>
			getNetworkErrorHandler().run(error)
		);
	}

	public delete(projectId: number): APIResult<void> {
		const endpoint = this.getProjectEndpoint(projectId);

		const request = this.axios.delete(endpoint).then(() => {
			return;
		});

		return ResultAsync.fromPromise(request, (error) =>
			getNetworkErrorHandler().run(error)
		);
	}

	public listMembers(
		projectId: number,
		abort?: AbortController
	): APIResultAbort<User[]> {
		const endpoint = this.getMembersEndpoint(projectId);

		const request = this.axios
			.get<UserResource[]>(endpoint, {
				signal: abort?.signal,
			})
			.then(({ data }) => transformArray(data, transformUserResource));

		return ResultAsync.fromPromise(request, (error) =>
			getAbortErrorHandler().run(error)
		);
	}

	public addMember(projectId: number, userId: number): APIResult<User> {
		const endpoint = this.getMembersEndpoint(projectId);

		const requestData = {
			user_id: userId,
		};

		const request = this.axios
			.post<UserResource>(endpoint, requestData)
			.then(({ data }) => transformUserResource(data));

		return ResultAsync.fromPromise(request, (error) =>
			getNetworkErrorHandler().run(error)
		);
	}

	public removeMember(projectId: number, userId: number): APIResult<void> {
		const endpoint = this.getMemberEndpoint(projectId, userId);

		const request = this.axios.delete(endpoint).then(() => {
			return;
		});

		return ResultAsync.fromPromise(request, (error) =>
			getNetworkErrorHandler().run(error)
		);
	}

	private getProjectEndpoint(projectId: number) {
		return ENDPOINT + projectId + "/";
	}

	private getMembersEndpoint(projectId: number) {
		return this.getProjectEndpoint(projectId) + ENDPOINT_MEMBER;
	}

	private getMemberEndpoint(projectId: number, userId: number) {
		return this.getMembersEndpoint(projectId) + userId + "/";
	}
}
