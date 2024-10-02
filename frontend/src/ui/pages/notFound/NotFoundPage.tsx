import { useI18nContext } from "i18n/i18n-react";
import { Link } from "react-router-dom";
import { Header } from "~ui/components/Header";

export function NotFoundPage() {
	const { LL } = useI18nContext();
	return (
		<>
			<Header />

			<p
				className="mx-auto mt-60 mb-6 h-24 animate-bounce bg-gradient-to-r from-slate-900
				via-blue-800 to-slate-900 bg-clip-text text-center text-6xl font-semibold
				text-transparent"
			>
				{LL.PAGE_NOT_FOUND()}
			</p>
			<div className="mx-auto flex place-content-center">
				<Link className="btn btn-primary btn-wide" to="/">
					{LL.START_PAGE()}
				</Link>
			</div>
		</>
	);
}
