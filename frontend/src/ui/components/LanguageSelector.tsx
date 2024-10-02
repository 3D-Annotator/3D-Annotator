import { useI18nContext } from "i18n/i18n-react";
import { useState } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { BritishFlag } from "~assets/icons/BritishFlag";
import { GermanFlag } from "~assets/icons/GermanFlag";
import { Language } from "~entity/Language";

export function LanguageSelector() {
	const [cookies, setCookie] = useCookies(["lang"]);
	const [selectedLanguage, setSelectedLanguage] = useState<Language>(
		(cookies.lang as Language) || Language.EN
	);
	const navigate = useNavigate();

	function onLanguageSelect(lang: Language) {
		if (lang === selectedLanguage) {
			return;
		}
		if (!confirm(LL.CONFIRM_RELOAD_ON_LANGUAGE_CHANGE())) return;

		setSelectedLanguage(lang);
		setCookie("lang", lang);
		navigate(0);
	}

	function getFlag(lang: Language) {
		switch (lang) {
			case Language.EN:
				return <BritishFlag />;
			case Language.DE:
				return <GermanFlag />;
		}
	}

	const { LL } = useI18nContext();
	return (
		<>
			<div className="dropdown-bottom dropdown">
				<label
					tabIndex={0}
					className="cursor-pointer text-neutral-content"
				>
					<div className="mx-4 h-10 w-10">
						{getFlag(selectedLanguage)}
					</div>
				</label>
				<ul
					tabIndex={0}
					className={
						"z-1 dropdown-content menu rounded-box right-0 m-2 w-52 bg-base-100 p-2 shadow"
					}
				>
					<li>
						<a
							onClick={() => {
								onLanguageSelect(Language.EN);
							}}
						>
							{LL.ENGLISH()}
						</a>
					</li>
					<li>
						<a
							onClick={() => {
								onLanguageSelect(Language.DE);
							}}
						>
							{LL.GERMAN()}
						</a>
					</li>
				</ul>
			</div>
		</>
	);
}
