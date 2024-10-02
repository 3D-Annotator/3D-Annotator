import { ENV } from "env";
import { createContext, useContext, type PropsWithChildren } from "react";
import { type API } from "~api/API";
import { APIv1 } from "~api/v1/APIv1";

const API = new APIv1(ENV.ANNOTATOR_3D_API_BASE_URL);
const API_CONTEXT = createContext<API>(API);

export function useAPI() {
	return useContext(API_CONTEXT);
}

export function APIProvider(props: PropsWithChildren) {
	return <API_CONTEXT.Provider value={API} {...props} />;
}
