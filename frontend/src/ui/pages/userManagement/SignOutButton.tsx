import { useI18nContext } from "i18n/i18n-react";
import { LanguageSelector } from "~ui/components/LanguageSelector";
import { useAPI } from "../../contexts/APIContext";

export function SignOutButton() {
	const { LL } = useI18nContext();
	const api = useAPI();

	return (
		<div className="flex justify-end">
			<LanguageSelector />
			<div
				className="my-auto mr-4 cursor-pointer text-xl text-neutral-content"
				onClick={async () => {
					await api.auth.signOut();
				}}
			>
				{LL.LOG_OUT()}
			</div>
		</div>
	);
}
