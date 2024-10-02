import { useI18nContext } from "i18n/i18n-react";
import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Errors } from "~api/Errors";
import { Header } from "~ui/components/Header";
import { StandardContainer } from "~ui/components/StandardContainer";
import { useAPI } from "../../contexts/APIContext";

export function SignUpPage() {
	const { LL } = useI18nContext();

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState({
		usedUsername: false,
		similarPassword: false,
		commonPassword: false,
		invalidEmail: false,
	});
	const api = useAPI();
	const navigate = useNavigate();

	const usernameRef = useRef<HTMLInputElement>(null);
	const emailRef = useRef<HTMLInputElement>(null);
	const passwordRef = useRef<HTMLInputElement>(null);
	const [formEmpty, setFormEmpty] = useState(false);

	function submit(submitEvent: FormEvent) {
		submitEvent.preventDefault();
		const username = usernameRef.current?.value;
		const email = emailRef.current?.value;
		const password = passwordRef.current?.value;
		if (username && email && password) {
			setFormEmpty(false);
			setLoading(true);
			api.auth
				.register(username, email, password)
				.match(
					() => {
						console.log("register successful");
						navigate("/", { replace: false });
					},
					(err) => {
						setError({
							usedUsername: err.get(Errors.USED_USER_NAME),

							similarPassword: err.get(Errors.SIMILAR_PASSWORD),

							commonPassword: err.get(Errors.COMMON_PASSWORD),

							invalidEmail: err.get(Errors.INVALID_EMAIL),
						});
						setLoading(false);
					}
				)
				.finally(() => {
					setLoading(false);
				});
		} else {
			setFormEmpty(true);
		}
	}

	return (
		<div>
			<Header>
				<div className="flex grow justify-end px-4">
					<Link
						className="text-xl text-neutral-content"
						to={"/login"}
					>
						{LL.LOG_IN()}
					</Link>
				</div>
			</Header>
			<div
				className="
		space-b-4 fixed top-1/2
		left-1/2 w-96 -translate-x-1/2


		-translate-y-1/2
		transform"
			>
				<StandardContainer>
					<div className="p-12">
						<h1 className="text-2xl">{LL.REGISTER()}</h1>
						<form onSubmit={submit}>
							<label htmlFor="username" className="label">
								<span className="label-text">
									{LL.USERNAME()}
								</span>
							</label>
							<input
								id="username"
								className={`input input-bordered w-full ${
									error.usedUsername && "input-error"
								}`}
								placeholder={LL.USERNAME()}
								type="text"
								maxLength={150}
								ref={usernameRef}
							/>
							<label
								htmlFor="username"
								className={`label ${
									!error.usedUsername && "hidden"
								}`}
							>
								<span className="label-text-alt text-error">
									{LL.USER_NAME_ALREADY_TAKEN()}
								</span>
							</label>

							<label htmlFor="email" className="label">
								<span className="label-text">
									{LL.EMAIL_ADDRESS()}
								</span>
							</label>
							<input
								id="email"
								className={`input input-bordered w-full ${
									error.invalidEmail && "input-error"
								}`}
								placeholder={LL.EMAIL_ADDRESS()}
								type="email"
								maxLength={150}
								ref={emailRef}
							/>
							<label
								htmlFor="email"
								className={`label ${
									!error.invalidEmail && "hidden"
								}`}
							>
								<span className="label-text-alt text-error">
									{LL.EMAIL_NOT_VALID()}
								</span>
							</label>

							<label htmlFor="password" className="label">
								<span className="label-text">
									{LL.PASSWORD()}
								</span>
							</label>
							<input
								id="password"
								className={`input input-bordered w-full ${
									(error.commonPassword ||
										error.similarPassword) &&
									"input-error"
								}`}
								placeholder={LL.PASSWORD()}
								type="password"
								minLength={8}
								maxLength={150}
								ref={passwordRef}
							/>
							<label htmlFor="password" className="label">
								<span
									className={`label-text-alt text-error ${
										!(
											error.commonPassword ||
											error.similarPassword
										) && "hidden"
									}`}
								>
									{LL.PASSWORD_INSECURE()}
								</span>
							</label>

							{formEmpty && (
								<p className="-mb-6 text-error">
									{LL.FILL_ALL_FIELDS()}
								</p>
							)}

							<button
								type="submit"
								className="btn btn-block mt-9 bg-primary normal-case"
								disabled={loading}
							>
								{LL.REGISTER()}
							</button>
						</form>
					</div>
				</StandardContainer>
			</div>
		</div>
	);
}
