import { useI18nContext } from "i18n/i18n-react";
import { Database, FileBox, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Errors } from "~api/Errors";
import { LockClosed } from "~assets/icons/LockClosed";
import { LockOpen } from "~assets/icons/LockOpen";
import { ModelType, type ModelInformation } from "~entity/ModelInformation";
import { type FullProject } from "~entity/Project";
import { useAPI } from "~ui/contexts/APIContext";
import { useAuth } from "~ui/contexts/AuthContext";
import { useProjectPageStore } from "~ui/pages/project/ProjectPage";
import { UpdateModelDataModal } from "~ui/pages/project/modals/UpdateModelDataModal";
import {
	humanReadableDataSize,
	writeStreamToLocalFileSystem,
} from "~util/FileUtils";
import { StandardContainer } from "../../components/StandardContainer";

interface ModelDataItemProps {
	model: ModelInformation;
	project: FullProject;
}

export function ModelDataItem({ model, project }: ModelDataItemProps) {
	const { LL } = useI18nContext();
	const navigate = useNavigate();

	const api = useAPI();
	const user = useAuth();
	const setLoading = useProjectPageStore((state) => state.setLoading);

	async function deleteModel(id: number) {
		await api.models.delete(id);
		setLoading(true);
	}

	function unlockModelData(id: number) {
		api.models.lock(id, false);
		setLoading(true);
	}

	async function exportAnnotationFile(id: number) {
		const res = await api.files.downloadAnnotationFile(id);

		if (res.isErr()) {
			return Promise.resolve(res.error.code);
		}
		const stream = res.value;
		await writeStreamToLocalFileSystem(stream);
		return Promise.resolve(undefined);
	}

	return (
		<StandardContainer>
			<div className="my-4 flex min-w-fit grow items-center gap-6 p-6">
				<div>
					<h2 className="text-xl">{model.name}</h2>
					<p className="mt-2 space-x-2">
						<div className="badge badge-outline">
							<UserRound size={14} className="mr-1" />{" "}
							{model.owner.username}
						</div>
						<div className="badge badge-outline">
							<FileBox size={14} className="mr-1" />
							{model.modelType === ModelType.MESH
								? LL.TRIANGLE_MESH()
								: LL.POINT_CLOUD()}
						</div>
						<div className="badge badge-outline">
							<Database size={14} className="mr-1" />
							{humanReadableDataSize(
								model.modelFile?.size ?? 0,
								10,
								0
							)}
						</div>
					</p>
				</div>

				<UpdateModelDataModal id={model.id} name={model.name} />

				<button
					className={`btn btn-primary normal-case`}
					onClick={async () => {
						const res = await exportAnnotationFile(model.id);
						if (!res) {
							toast.success(LL.DOWNLOAD_SUCCESS());
						}

						if (res === Errors.NO_ANNOTATION_FILE) {
							toast.warning(LL.NO_ANNOTATION_FILE());
						}
					}}
				>
					{LL.EXPORT()}
				</button>
				<button
					className="btn btn-error normal-case"
					onClick={() => {
						deleteModel(model.id);
					}}
				>
					{LL.DELETE()}
				</button>

				{/*
				 * Model is locked and user is the project owner
				 */}
				{model.locked &&
					model.locked.id !== user!.id &&
					user?.id === project.owner.id && (
						<div
							className="tooltip"
							data-tip={`Gesperrt von: ` + model.locked.username}
						>
							<button
								className="btn btn-info normal-case"
								onClick={() => {
									unlockModelData(model.id);
								}}
							>
								<div className="mr-1 -ml-1 h-6 w-6 text-base-content">
									<LockOpen />
								</div>
								{LL.UNLOCK()}
							</button>
						</div>
					)}

				{/*
				 * Model is locked, but user is not the project owner
				 */}
				{model.locked &&
					model.locked.id !== user!.id &&
					user?.id !== project.owner.id && (
						<div
							className="tooltip"
							data-tip={`Gesperrt von: ` + model.locked.username}
						>
							<button className="btn btn-disabled" disabled>
								<div className="p h-6 w-6 text-base-content">
									<LockClosed />
								</div>
							</button>
						</div>
					)}

				{/*
				 * Model is not locked
				 */}
				{!(model.locked && model.locked.id !== user!.id) && (
					<button
						className="btn btn-accent normal-case"
						onClick={() => {
							if (project.labels.length === 0) {
								toast.warning(LL.NO_LABELS_FOUND());
								return;
							}
							navigate(`/annotate/${model.id}`);
						}}
					>
						{LL.OPEN()}
					</button>
				)}
			</div>
		</StandardContainer>
	);
}
