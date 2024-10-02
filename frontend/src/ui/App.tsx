import { ENV } from "env";
import TypesafeI18n from "i18n/i18n-react";
import { detectLocale } from "i18n/i18n-util";
import { loadLocaleAsync } from "i18n/i18n-util.async";
import { useEffect, useState } from "react";
import { CookiesProvider } from "react-cookie";
import { ToastContainer } from "react-toastify";
import { documentCookieDetector } from "typesafe-i18n/detectors";
import { Routing } from "./Routing";
import { APIProvider } from "./contexts/APIContext";
import { AuthProvider } from "./contexts/AuthContext";

console.log("++++++++++++++++++++ VERSION ++++++++++++++++++++");
console.log(
	`Backend:  ${ENV.ANNOTATOR_3D_BACKEND_VERSION} (${ENV.ANNOTATOR_3D_BACKEND_VERSION_SHA})`
);
console.log(
	`Frontend: ${ENV.ANNOTATOR_3D_FRONTEND_VERSION} (${ENV.ANNOTATOR_3D_FRONTEND_VERSION_SHA})`
);
console.log(
	`Server:   ${ENV.ANNOTATOR_3D_SERVER_VERSION} (${ENV.ANNOTATOR_3D_SERVER_VERSION_SHA})`
);
console.log("+++++++++++++++++++++++++++++++++++++++++++++++++");

const detectedLocale = detectLocale(documentCookieDetector);

console.log("Detected locale:", detectedLocale);

export function App() {
	const [wasLoaded, setWasLoaded] = useState(false);

	useEffect(() => {
		loadLocaleAsync(detectedLocale).then(() => {
			setWasLoaded(true);
		});
	}, []);

	if (!wasLoaded) return null;

	return (
		<APIProvider>
			<AuthProvider>
				<CookiesProvider defaultSetOptions={{ path: "/" }}>
					<TypesafeI18n locale={detectedLocale}>
						<Routing />
						<ToastContainer
							position="bottom-right"
							autoClose={5000}
							hideProgressBar={false}
							newestOnTop={false}
							closeOnClick={false}
							pauseOnFocusLoss={false}
							draggable={true}
							pauseOnHover={true}
							theme={"colored"}
							limit={10}
						/>
					</TypesafeI18n>
				</CookiesProvider>
			</AuthProvider>
		</APIProvider>
	);
}
