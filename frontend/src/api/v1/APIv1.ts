import axios, { type AxiosInstance } from "axios";
import {
	type API,
	type Auth,
	type Files,
	type Labels,
	type Models,
	type Projects,
	type Users,
} from "../API";
import { AuthV1 } from "./endpoints/Auth";
import { FilesV1 } from "./endpoints/Files";
import { LabelsV1 } from "./endpoints/Labels";
import { ModelsV1 } from "./endpoints/Models";
import { ProjectsV1 } from "./endpoints/Projects";
import { UsersV1 } from "./endpoints/Users";
import { convertBlobData } from "./errors/ErrorHandler";
import {
	requestErrorLogger,
	requestLogger,
	responseErrorLogger,
	responseLogger,
} from "./logger/Logger";

const VERSION = "v1";
export const PREFIX = "APIv1: ";

const SECOND = 1000;
const DEFAULT_TIMEOUT = 10 * SECOND;

export class APIv1 implements API {
	private axios: AxiosInstance;

	readonly auth: Auth;
	readonly users: Users;
	readonly projects: Projects;
	readonly models: Models;
	readonly labels: Labels;
	readonly files: Files;

	constructor(baseURL: string, axiosInstance?: AxiosInstance) {
		const formattedBaseURL = this.formatBaseURL(baseURL, VERSION);

		this.axios = axiosInstance
			? axiosInstance
			: axios.create({
					baseURL: formattedBaseURL,
					timeout: DEFAULT_TIMEOUT,
			  });
		/**
		 * Add loggers for requests. As long as all other interceptors
		 * are being initialized inside the constructors of the
		 * following classes, this will be the last interceptor that
		 * is being run before dispatch.
		 */
		this.axios.interceptors.request.use(requestLogger, requestErrorLogger);

		this.auth = new AuthV1(this.axios);
		this.users = new UsersV1(this.axios);
		this.projects = new ProjectsV1(this.axios);
		this.models = new ModelsV1(this.axios);
		this.labels = new LabelsV1(this.axios);
		this.files = new FilesV1(this.axios);

		// convert blob errors back to json
		this.axios.interceptors.response.use((value) => value, convertBlobData);
		/**
		 * Add loggers for responses. As long as all other interceptors
		 * are being initialized inside the constructors of the
		 * previous classes, this will be the last interceptor that
		 * is being run before the request Promise is being resolved or
		 * rejected.
		 */
		this.axios.interceptors.response.use(
			responseLogger,
			responseErrorLogger
		);
	}

	private formatBaseURL(baseUrl: string, version: string): string {
		if (baseUrl.endsWith("/")) {
			return `${baseUrl}${version}/`;
		} else {
			return `${baseUrl}/${version}/`;
		}
	}
}
