import { type ResultAsync } from "neverthrow";
import { type Color, type Label } from "~entity/Annotation";
import {
	type FileInformation,
	type ModelInformation,
	type ModelType,
} from "~entity/ModelInformation";
import { type FullProject, type Project } from "~entity/Project";
import { type Observer, type Unsubscribe } from "~entity/Types";
import { type FullUser, type User } from "~entity/User";
import { type NamedStream } from "~util/streams/StreamUtils";
import {
	type APIError,
	type ErrorMap,
	type Errors,
	type SingularError,
} from "./Errors";

export interface API {
	readonly auth: Auth;
	readonly users: Users;
	readonly projects: Projects;
	readonly models: Models;
	readonly labels: Labels;
	readonly files: Files;
}

/**
 * This type is returned by every api call.
 * It hold either the successful response T or the Error E wrapped in ResultAsync from
 * the neverthrow package. This simplifies response/error handling with utility methods
 *
 * !!! IMPORTANT NOTE !!!
 *
 * The error response is only supposed to hold errors that have to be solved by the client
 * and could have not been prevented in the first place.
 *
 * Example: The Auth.register method throws an Error at runtime if the username is longer than
 * a certain amount of characters. This should be checked by the user of this api before calling
 * the register method. All errors thrown at runtime are caused by programmer error, either in
 * the code that uses this api, in the api implementation or in the api backend.
 *
 * @param T the return type on success
 * @param E the return type on failure, default is void i.e. no expected errors
 */
export type APIResult<
	T,
	E extends APIError = SingularError<Errors.NETWORK>
> = ResultAsync<T, E>;

export type APIResultAbort<T> = APIResult<
	T,
	SingularError<Errors.NETWORK | Errors.ABORTED>
>;

export interface Auth {
	signIn(
		username: string,
		password: string
	): APIResult<
		FullUser,
		SingularError<Errors.NETWORK | Errors.INVALID_CREDENTIALS>
	>;

	signOut(): APIResult<void>;

	/**
	 * Registers a new user.
	 *
	 * @param username the new username
	 * @param email the users email
	 * @param password the new password
	 * @return A result containing either a FullUser or an ErrorMap.
	 * @throws {Error} if the username, email or password are too long.
	 * @throws {Error} if the password does not meet certain criteria.
	 *
	 * For more infos on the possible errors refer to an implementation of this method.
	 */
	register(
		username: string,
		email: string,
		password: string
	): APIResult<
		FullUser,
		ErrorMap<
			| Errors.NETWORK
			| Errors.USED_USER_NAME
			| Errors.SIMILAR_PASSWORD
			| Errors.COMMON_PASSWORD
			| Errors.INVALID_EMAIL
		>
	>;
	onAuthStateChanged(callback: Observer<FullUser | null>): Unsubscribe;
}

export interface Users {
	list(abort?: AbortController): APIResultAbort<User[]>;
}

export interface ProjectData {
	readonly name: string;
	readonly description: string;
}

export interface Projects {
	list(userId: number, abort?: AbortController): APIResultAbort<Project[]>;
	add(project: ProjectData): APIResult<Project>;
	detail(
		projectId: number,
		abort?: AbortController
	): APIResultAbort<FullProject>;
	update(projectId: number, project: ProjectData): APIResult<FullProject>;
	delete(projectId: number): APIResult<void>;
	listMembers(
		projectId: number,
		abort?: AbortController
	): APIResultAbort<User[]>;
	addMember(projectId: number, userId: number): APIResult<User>;
	removeMember(projectId: number, userId: number): APIResult<void>;
}

export interface NewModelInformation {
	readonly projectId: number;
	readonly name: string;
	readonly modelType: ModelType;
}

export interface Models {
	list(
		projectId: number,
		abort?: AbortController
	): APIResultAbort<ModelInformation[]>;
	add(modelInformation: NewModelInformation): APIResult<ModelInformation>;
	detail(
		modelId: number,
		abort?: AbortController
	): APIResultAbort<ModelInformation>;
	update(modelId: number, name: string): APIResult<ModelInformation>;
	delete(modelId: number): APIResult<void>;
	lock(
		modelId: number,
		lock: boolean
	): APIResult<void, SingularError<Errors.NETWORK | Errors.LOCKED>>;
}

export interface NewLabel {
	readonly projectId: number;
	readonly annotationClass: number;
	readonly name: string;
	readonly color: Color;
}

export interface Labels {
	list(projectId: number, abort?: AbortController): APIResultAbort<Label[]>;
	add(
		label: NewLabel
	): APIResult<
		Label,
		SingularError<Errors.NETWORK | Errors.USED_ANNOTATION_CLASS>
	>;
	detail(labelId: number, abort?: AbortController): APIResultAbort<Label>;
	update(labelId: number, name: string, color: Color): APIResult<Label>;
	delete(labelId: number): APIResult<void>;
}
export interface Files {
	/**
	 * Starts the download of the model file and returns readable streams of the
	 * incoming data. Each stream represents a separate files (e.g. textures and
	 * so on).
	 *
	 * @param modelId the id of the model
	 * @param onProgress progress observer which receives the progress in percent (number between 0 and 100
	 * @return the incoming file data as a readable stream
	 * @throws EXISTING_BASE_FILE if the file already exists
	 * @throws LARGE_FILE if the file is too large (depends on the implementation)
	 */
	downloadModel(
		modelId: number,
		onProgress?: Observer<number>,
		abort?: AbortController
	): APIResult<NamedStream[], SingularError<Errors.NETWORK | Errors.ABORTED>>;

	uploadModel(
		modelId: number,
		fileStreams: NamedStream[],
		onProgress?: Observer<number>
	): APIResult<
		FileInformation,
		SingularError<
			Errors.NETWORK | Errors.EXISTING_BASE_FILE | Errors.LARGE_FILE
		>
	>;

	downloadAnnotationFile(
		modelId: number,
		onProgress?: Observer<number>,
		abort?: AbortController
	): APIResult<
		ReadableStream<Uint8Array>,
		SingularError<
			Errors.NETWORK | Errors.ABORTED | Errors.NO_ANNOTATION_FILE
		>
	>;

	uploadAnnotationFile(
		modelId: number,
		fileStream: ReadableStream<Uint8Array>,
		onProgress?: Observer<number>
	): APIResult<
		FileInformation,
		SingularError<Errors.NETWORK | Errors.LOCKED | Errors.LARGE_FILE>
	>;
}
