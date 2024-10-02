import {
	createContext,
	useContext,
	useEffect,
	useState,
	type PropsWithChildren,
} from "react";
import { type FullUser } from "~entity/User";
import { useAPI } from "./APIContext";

const AUTH_CONTEXT = createContext<FullUser | null>(null);

export function useAuth() {
	return useContext(AUTH_CONTEXT);
}

export function AuthProvider({ children }: PropsWithChildren) {
	const api = useAPI();
	const [currentUser, setCurrentUser] = useState<FullUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const unsubscribe = api.auth.onAuthStateChanged((user) => {
			setCurrentUser(user);
			setLoading(false);
		});
		return unsubscribe;
	}, [api]);

	return (
		<AUTH_CONTEXT.Provider value={currentUser}>
			{!loading && children}
		</AUTH_CONTEXT.Provider>
	);
}
