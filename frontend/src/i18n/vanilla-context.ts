import { documentCookieDetector } from "typesafe-i18n/detectors";
import { detectLocale, i18nObject } from "./i18n-util";
import { loadAllLocales } from "./i18n-util.sync";

loadAllLocales();
const detectedLocale = detectLocale(documentCookieDetector);
const LL = i18nObject(detectedLocale);

export function getI18NContext() {
	return LL;
}
