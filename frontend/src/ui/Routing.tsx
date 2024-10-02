import { BrowserRouter, Navigate, useRoutes } from "react-router-dom";
import { AnnotatorPage } from "./annotator/Annotator";
import { useAuth } from "./contexts/AuthContext";
import { NotFoundPage } from "./pages/notFound/NotFoundPage";
import { ProjectPage } from "./pages/project/ProjectPage";
import { ProjectOverviewPage } from "./pages/projectOverview/ProjectOverviewPage";
import { SignInPage } from "./pages/userManagement/SignInPage";
import { SignUpPage } from "./pages/userManagement/SignUpPage";

const ROUTES = (isLoggedIn: boolean) => [
	{
		path: "/",
		element: isLoggedIn ? (
			<ProjectOverviewPage />
		) : (
			<Navigate to="/login" />
		),
	},
	{
		path: "/project",
		children: [
			{
				path: "",
				element: <NotFoundPage />,
			},
			{
				path: ":projectId",
				element: isLoggedIn ? (
					<ProjectPage />
				) : (
					<Navigate to="/login" />
				),
			},
		],
	},
	{
		path: "/annotate",
		children: [
			{
				path: "",
				element: <NotFoundPage />,
			},
			{
				path: ":annotatorId",
				element: isLoggedIn ? (
					<AnnotatorPage />
				) : (
					<Navigate to="/login" />
				),
			},
		],
	},
	{
		path: "/login",
		element: !isLoggedIn ? <SignInPage /> : <Navigate to="/" />,
	},
	{
		path: "/register",
		element: !isLoggedIn ? <SignUpPage /> : <Navigate to="/" />,
	},
	{
		path: "/*",
		element: <NotFoundPage />,
	},
];

export function Routing() {
	return (
		<BrowserRouter>
			<Router />
		</BrowserRouter>
	);
}

function Router() {
	const currentUser = useAuth();
	const isLoggedIn = currentUser !== null;
	const routing = useRoutes(ROUTES(isLoggedIn));

	return routing;
}
