import { useI18nContext } from "i18n/i18n-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { create } from "zustand";
import { type FullProject } from "~entity/Project";
import { ElementList } from "~ui/components/ElementList";
import { Header } from "~ui/components/Header";
import { LabelItem } from "~ui/components/LabelItem";
import { StandardContainer } from "~ui/components/StandardContainer";
import { UserItem } from "~ui/components/UserItem";
import { ModelDataItem } from "~ui/pages/project/ModelDataItem";
import { AddModelDataModalController } from "~ui/pages/project/addModel/AddModelDataModalController";
import { LabelModal } from "~ui/pages/project/modals/LabelModal";
import { UpdateMembersModal } from "~ui/pages/project/modals/UpdateMembersModal";
import { UpdateProjectModal } from "~ui/pages/project/modals/UpdateProjectModal";
import { SignOutButton } from "~ui/pages/userManagement/SignOutButton";
import { useAPI } from "../../contexts/APIContext";
import { useAuth } from "../../contexts/AuthContext";

interface ProjectPageState {
	loading: boolean;
	setLoading: (loading: boolean) => void;
}

export const useProjectPageStore = create<ProjectPageState>((set) => ({
	loading: true,
	setLoading: (loading) => {
		set({ loading });
	},
}));

export function ProjectPage() {
	const params = useParams();
	if (!params.projectId) {
		throw new Error("No Project id.");
	}
	const projectId = +params.projectId;

	const { LL } = useI18nContext();

	const api = useAPI();
	const user = useAuth();
	const navigate = useNavigate();
	const { loading, setLoading } = useProjectPageStore();
	const [projectDetails, setProjectDetails] = useState<FullProject>();

	function deleteProject() {
		api.projects.delete(projectId);
		navigate("/");
	}

	function leaveProject() {
		api.projects.removeMember(projectId, user!.id).match(
			() => {
				setLoading(true);
				navigate("/");
			},
			() => {
				// nothing to do
			}
		);
	}

	useEffect(() => {
		async function getProject() {
			try {
				const res = await api.projects.detail(projectId);

				if (res.isErr()) {
					throw new Error("No Project");
				}
				setProjectDetails(res.value);
				setLoading(false);
			} catch (err) {
				navigate("/404");
			}
			setLoading(false);
		}
		if (!projectId) {
			navigate("/404");
			return;
		}
		if (user) {
			getProject();
		}
	}, [api, user, params, loading, navigate, projectId]);

	let modelDataElementList: JSX.Element[] = [];
	let labelItemList: JSX.Element[] = [];
	let userItemList: JSX.Element[] = [];

	let name = "";
	let description = "";

	if (!loading && projectDetails) {
		name = projectDetails.name;
		description = projectDetails.description;

		modelDataElementList = projectDetails.models.map((element) => (
			<ModelDataItem
				model={element}
				project={projectDetails}
				key={element.id}
			/>
		));

		labelItemList = projectDetails.labels.map((element) => (
			<LabelItem
				name={element.name}
				color={element.color.asHTMLCode()}
				key={element.id}
			/>
		));

		userItemList = projectDetails.users.map((element) => (
			<UserItem name={element.username} key={element.id} />
		));
	}

	const isOwner = user?.id === projectDetails?.owner.id;

	return (
		<div>
			<Header>
				<SignOutButton />
			</Header>
			<div className="mx-auto w-3/4">
				<div className="">
					<h1 className="w-2/3 py-4 text-2xl">{name}</h1>
					<p className="w-full">{description}</p>
				</div>

				<div className="flex">
					<div className="mr-4 w-full">
						<ElementList items={modelDataElementList} />
					</div>
					<div className="w-1/3">
						<StandardContainer>
							<div className="sticky top-40 mt-4 h-fit p-6">
								<div className="mb-4">
									<AddModelDataModalController
										projectId={projectId}
									/>
								</div>
								<h2 className="text-xl">{LL.LABELS()}</h2>
								<ul className="my-4 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
									{!loading && labelItemList}
								</ul>

								<div className="my-4">
									<LabelModal project={projectDetails} />
								</div>
								<h2 className="text-xl">{LL.OWNER()}</h2>
								<div className="my-4 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
									<UserItem
										name={
											projectDetails
												? projectDetails.owner.username
												: ""
										}
									/>
								</div>
								<h2 className="text-xl">{LL.MEMBERS()}</h2>
								<ul className="my-4 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
									{!loading && userItemList}
								</ul>
								{isOwner ? (
									<div className="mt-4">
										<UpdateMembersModal
											project={projectDetails}
											setLoading={setLoading}
										/>
									</div>
								) : (
									<></>
								)}

								<div className="divider" />

								<div className="my-4">
									<UpdateProjectModal
										project={projectDetails!}
										setLoading={setLoading}
									/>
								</div>
								{isOwner ? (
									<div className="mt-4">
										<button
											className="btn btn-error w-full normal-case"
											onClick={deleteProject}
										>
											{LL.DELETE_PROJECT()}
										</button>
									</div>
								) : (
									<div className="mt-4">
										<button
											className="btn btn-error w-full normal-case"
											onClick={leaveProject}
										>
											{LL.LEAVE_PROJECT()}
										</button>
									</div>
								)}
							</div>
						</StandardContainer>
					</div>
				</div>
			</div>
		</div>
	);
}
