import { useI18nContext } from "i18n/i18n-react";
import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Header } from "~ui/components/Header";
import { StandardContainer } from "~ui/components/StandardContainer";
import { useAPI } from "../../contexts/APIContext";

export function SignInPage() {
	const { LL } = useI18nContext();
	const [loading, setLoading] = useState(false);
	const [invalidCredentials, setInvalidCredentials] = useState(false);
	const api = useAPI();

	const usernameRef = useRef<HTMLInputElement>(null);
	const passwordRef = useRef<HTMLInputElement>(null);

	function submit(submitEvent: FormEvent) {
		submitEvent.preventDefault();
		const username = usernameRef.current?.value;
		const password = passwordRef.current?.value;
		setLoading(true);
		setInvalidCredentials(false);
		api.auth
			.signIn(username ? username : "", password ? password : "")
			.match(
				() => {
					// auth state is automatically updated in Routing.
					// explicit routing is not necessary.
				},
				() => {
					setInvalidCredentials(true);
				}
			)
			.finally(() => {
				setLoading(false);
			});
	}

	return (
		<>
			<Header>
				<div className="flex grow justify-end px-4">
					<Link
						className="text-xl text-neutral-content"
						to={"/register"}
					>
						{LL.REGISTER()}
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
						<h1 className="text-2xl">{LL.LOG_IN()}</h1>
						<form onSubmit={submit}>
							<label htmlFor="username" className="label">
								<span className="label-text">
									{LL.USERNAME()}
								</span>
							</label>
							<input
								id="username"
								className={`input input-bordered w-full ${
									invalidCredentials && "input-error"
								}`}
								placeholder={LL.USERNAME()}
								type="text"
								ref={usernameRef}
							/>

							<label htmlFor="password" className="label">
								<span className="label-text">
									{LL.PASSWORD()}
								</span>
							</label>
							<input
								id="password"
								className={`input input-bordered w-full ${
									invalidCredentials && "input-error"
								}`}
								placeholder={LL.PASSWORD()}
								type="password"
								ref={passwordRef}
							/>

							{invalidCredentials && (
								<p className="mt-4 -mb-5 text-error">
									{LL.INVALID_LOGIN_CREDENTIALS()}
								</p>
							)}

							<button
								type="submit"
								className="btn btn-block mt-9 bg-primary normal-case"
								disabled={loading}
							>
								{LL.LOG_IN()}
							</button>
						</form>
					</div>
				</StandardContainer>
			</div>
		</>
	);
}
