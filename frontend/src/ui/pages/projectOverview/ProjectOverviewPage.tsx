import { useI18nContext } from "i18n/i18n-react";
import { useEffect, useState } from "react";
import { ThreeDots } from "react-loader-spinner";
import { Link } from "react-router-dom";
import { type API } from "~api/API";
import { type Project } from "~entity/Project";
import { type User } from "~entity/User";
import { ElementList } from "~ui/components/ElementList";
import { Header } from "~ui/components/Header";
import { StandardContainer } from "~ui/components/StandardContainer";
import { AddProjectModal } from "~ui/pages/projectOverview/AddProjectModal";
import { useAPI } from "../../contexts/APIContext";
import { useAuth } from "../../contexts/AuthContext";
import { SignOutButton } from "../userManagement/SignOutButton";

export function ProjectOverviewPage() {
	const { LL } = useI18nContext();
	const api = useAPI();
	const user = useAuth();

	const [projectList, setProjectList] = useState<Project[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function getUserProjects(api: API, user: User) {
			const result = await api.projects.list(user.id).unwrapOr([]);
			setProjectList(result);
			setLoading(false);
		}
		if (user) getUserProjects(api, user);
	}, [api, user, loading]);

	const projectItemElementList = projectList.map((element) => (
		<ProjectItem project={element} key={element.id} />
	));

	return (
		<div>
			<Header>
				<SignOutButton />
			</Header>
			<div className="mx-auto w-3/4">
				<div className="flex py-5">
					<h1 className="text-2xl">{LL.MY_PROJECTS()}</h1>
					<div className="ml-auto">
						<AddProjectModal />
					</div>
				</div>
				<div className={`mx-auto w-fit ${!loading && "hidden"}`}>
					<ThreeDots color="#082032" height={160} width={160} />
				</div>

				<ElementList items={projectItemElementList} />
			</div>
		</div>
	);
}

interface ProjectItemProps {
	project: Project;
}

function ProjectItem({ project: { name, owner, id } }: ProjectItemProps) {
	const { LL } = useI18nContext();
	return (
		<StandardContainer>
			<div className="my-4 flex grow gap-8 rounded-3xl p-6">
				<div>
					<h2 className="text-xl">{name}</h2>
					<p>
						{LL.OWNER()}: {owner.username}
					</p>
				</div>
				<div className="ml-auto">
					<Link to={`/project/${id}`}>
						<button className="btn btn-accent normal-case">
							{LL.OPEN()}
						</button>
					</Link>
				</div>
			</div>
		</StandardContainer>
	);
}
