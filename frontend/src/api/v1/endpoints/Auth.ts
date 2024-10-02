import {
	type AxiosInstance,
	type AxiosRequestConfig,
	type AxiosResponse,
} from "axios";
import { ResultAsync } from "neverthrow";
import { type APIResult, type Auth } from "~api/API";
import { ErrorMap, Errors, SingularError } from "~api/Errors";
import {
	defaultApiResponseErrorHandler,
	defaultApiValidationErrorHandler,
	emptyErrorHandler,
	getDefaultErrorHandler,
	getNetworkErrorHandler,
} from "~api/v1/errors/ErrorHandler";
import { authStateLogger } from "~api/v1/logger/Logger";
import {
	type FullUserResource,
	type LoginResource,
} from "~api/v1/resources/Resources";
import { transformFullUserResource } from "~api/v1/resources/Transformations";
import {
	validateNonNumericString,
	validateString,
} from "~api/v1/validation/Validation";
import { type Observer, type Unsubscribe } from "~entity/Types";
import { type FullUser } from "~entity/User";

// validity period of token in hours
const TOKEN_TTL = 24;
// key of user data in local storage
const STORAGE_KEY = "annotatorUserData";

interface State {
	expiry: Date;
	token: string;
	user: FullUser;
}

type RegisterErrors =
	| Errors.NETWORK
	| Errors.USED_USER_NAME
	| Errors.SIMILAR_PASSWORD
	| Errors.COMMON_PASSWORD
	| Errors.INVALID_EMAIL;

export class AuthV1 implements Auth {
	private axios: AxiosInstance;

	// User data
	private expiry: Date | null = null;
	private token: string | null = null;
	private currentUser: FullUser | null = null;

	private authStateObservers = new Set<Observer<FullUser | null>>();

	/*
	 *   +++ AXIOS INTERCEPTORS +++
	 */

	private setAuthToken = (
		config: AxiosRequestConfig<unknown>
	): AxiosRequestConfig<unknown> => {
		if (this.token && config.headers) {
			config.headers.Authorization = `Token ${this.token}`;
		}
		return config;
	};

	private loginChecker = emptyErrorHandler().onAPIResponseError(
		(apiError, error) => {
			if (apiError.status === 401 && apiError.code === "not_logged_in") {
				this.resetState();
				this.setLocalStorage();
				this.notifyAuthStateObservers(null);
			}

			return Promise.reject(error);
		}
	);

	private updateExpiry = (value: AxiosResponse): AxiosResponse => {
		if (!this.expiry) {
			return value;
		}
		const timeDiffMilliseconds = TOKEN_TTL * 60 * 60 * 1000;
		this.expiry.setTime(new Date().getTime() + timeDiffMilliseconds);
		this.setLocalStorage();
		return value;
	};

	/*
	 *   +++ CONSTRUCTOR AND OBJECT STATE MANAGEMENT +++
	 */

	/**
	 * Constructs a new AuthV1 instance.
	 *
	 * When using axios interceptors, please make sure that they
	 * are initialized in the constructor. Otherwise changes made
	 * to the request or response will not show up in the debug logs.
	 *
	 * @param axios the axios instance used for all requests
	 */
	constructor(axios: AxiosInstance) {
		this.axios = axios;

		// setup interceptors
		this.axios.interceptors.request.use(
			this.setAuthToken.bind(this),
			(err) => Promise.reject(err)
		);
		this.axios.interceptors.response.use(
			this.updateExpiry.bind(this),
			// expiry date is not updated on errors
			(err) => Promise.reject(err)
		);
		this.axios.interceptors.response.use(
			(value) => value,
			(err) => this.loginChecker.run(err)
		);

		this.readLocalStorage();
	}

	private resetState() {
		this.expiry = null;
		this.token = null;
		this.currentUser = null;
	}

	private setState({ expiry, token, user }: State) {
		this.expiry = expiry;
		this.token = token;
		this.currentUser = user;
	}

	/*
	 *   +++ LOCAL STORAGE +++
	 */

	private setLocalStorage() {
		if (
			this.expiry === null ||
			this.token === null ||
			this.currentUser === null
		) {
			localStorage.removeItem(STORAGE_KEY);
			return;
		}

		const data: State = {
			expiry: this.expiry,
			token: this.token,
			user: this.currentUser,
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	}

	private readLocalStorage() {
		const res = localStorage.getItem(STORAGE_KEY);
		if (!res) {
			this.resetState();
			return;
		}

		const values = JSON.parse(res) as State;
		const expiryDate = new Date(values.expiry);
		// log out if token is expired
		if (expiryDate < new Date()) {
			return;
		}

		this.expiry = expiryDate;
		this.token = values.token;
		this.currentUser = values.user;
	}

	/*
	 *   +++ PUBLIC METHODS +++
	 */

	public signIn(
		username: string,
		password: string
	): APIResult<
		FullUser,
		SingularError<Errors.NETWORK | Errors.INVALID_CREDENTIALS>
	> {
		const endpoint = "login/";
		const requestData = {};
		const config = {
			auth: {
				username: username,
				password: password,
			},
		};
		const request = this.axios
			.post<LoginResource>(endpoint, requestData, config)
			// transform server response
			.then<State>(({ data }) => {
				return {
					expiry: new Date(data.expiry),
					token: data.token,
					user: transformFullUserResource(data.user),
				};
			})
			.then((res) => {
				this.setState(res);
				this.setLocalStorage();
				this.notifyAuthStateObservers(this.currentUser);
				return res.user;
			});

		const errorHandler = getNetworkErrorHandler<
			SingularError<Errors.INVALID_CREDENTIALS>
		>().onAPIResponseError((apiError, error) => {
			if (
				apiError.status === 401 &&
				apiError.code === "invalid_credentials"
			) {
				return new SingularError(
					Errors.INVALID_CREDENTIALS,
					apiError.message
				);
			} else {
				defaultApiResponseErrorHandler(apiError, error);
			}
		});

		return ResultAsync.fromPromise(request, (error) =>
			errorHandler.run(error)
		);
	}

	public signOut(): APIResult<void> {
		const endpoint = "logout/";
		const requestData = {};

		const request = this.axios
			.post<void>(endpoint, requestData)
			.then(() => {
				this.resetState();
				this.setLocalStorage();
				this.notifyAuthStateObservers(null);
				return;
			});

		return ResultAsync.fromPromise(request, (error) =>
			getNetworkErrorHandler().run(error)
		);
	}

	/**
	 *
	 * @throws {Error} if the username, email or password are longer than 150 characters.
	 * @throws {Error} if the password is shorter than 8 characters
	 * @throws {Error} if the password is entirely numeric
	 */
	public register(
		userName: string,
		email: string,
		password: string
	): APIResult<FullUser, ErrorMap<RegisterErrors>> {
		validateString(userName, "username", 150);
		validateString(email, "email", 150);
		validateString(password, "password", 150, 8);
		validateNonNumericString(password, "password");

		const endpoint = "register/";
		const requestData = {
			username: userName,
			email: email,
			password: password,
		};

		const request = this.axios
			.post<FullUserResource>(endpoint, requestData)
			.then(({ data }) => {
				return transformFullUserResource(data);
			});

		const errorHandler = getDefaultErrorHandler<
			ErrorMap<RegisterErrors>,
			typeof requestData
		>()
			.onNetworkError(() => {
				const errors = new ErrorMap<RegisterErrors>();
				errors.set(Errors.NETWORK, true);
				return errors;
			})
			.onAPIValidationError((apiError, axiosError) => {
				const validationErrors = apiError.errors;
				const errors = new ErrorMap<RegisterErrors>();

				validationErrors?.username?.forEach((error) => {
					if (error.code === "unique") {
						errors.set(Errors.USED_USER_NAME, true);
					} else {
						defaultApiValidationErrorHandler(apiError, axiosError);
					}
				});

				validationErrors?.email?.forEach((error) => {
					if (error.code === "invalid") {
						errors.set(Errors.INVALID_EMAIL, true);
					} else {
						defaultApiValidationErrorHandler(apiError, axiosError);
					}
				});

				validationErrors?.password?.forEach((error) => {
					switch (error.code) {
						case "password_too_similar":
							errors.set(Errors.SIMILAR_PASSWORD, true);
							break;
						case "password_too_common":
							errors.set(Errors.COMMON_PASSWORD, true);
							break;
						default:
							defaultApiValidationErrorHandler(
								apiError,
								axiosError
							);
					}
				});

				return errors;
			});

		return ResultAsync.fromPromise(request, (error) =>
			errorHandler.run(error)
		);
	}

	/*
	 *   +++ AUTH STATE +++
	 */

	/**
	 * Register a observer to be notified when the auth state changes.
	 * When calling this method, the observer is immediately called from
	 * within this method with the initial auth state.
	 *
	 * @param observer the observer
	 * @returns a method that unsubscribes the observer
	 */
	public onAuthStateChanged(
		observer: Observer<FullUser | null>
	): Unsubscribe {
		this.authStateObservers.add(observer);
		observer(this.currentUser);
		return () => {
			this.authStateObservers.delete(observer);
		};
	}

	private notifyAuthStateObservers(user: FullUser | null) {
		authStateLogger(user, this.token, this.expiry);
		for (const observer of this.authStateObservers) {
			observer(user);
		}
	}
}
