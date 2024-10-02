import { useI18nContext } from "i18n/i18n-react";
import { toast } from "react-toastify";
import { Errors } from "~api/Errors";
import { useAPI } from "~ui/contexts/APIContext";
import { assertUnreachable } from "~util/TypeScript";

export function useUpdateAnnotationFile() {
	const { LL } = useI18nContext();
	const api = useAPI();

	async function updateAnnotationFile(modelId: number, annotationFile: File) {
		const fileStream = annotationFile.stream();

		const id = toast.info(LL.COMPRESSING(), {
			isLoading: true,
		});

		const filesRes = await api.files.uploadAnnotationFile(
			modelId,
			fileStream,
			(n) => {
				//if (n < 100) {
				toast.update(id, {
					progress: n / 100,
					isLoading: false,
					render: LL.UPLOADING(),
				});
			}
		);

		if (filesRes.isErr()) {
			const error = filesRes.error;

			switch (error.code) {
				case Errors.NETWORK:
					break;
				case Errors.LARGE_FILE:
					toast.update(id, {
						progress: 0,
						hideProgressBar: true,
						isLoading: false,
						autoClose: 5000,
						type: "error",
						render: LL.ANNOTATION_FILE_TOO_BIG(),
					});
					console.log("large file");
					break;
				case Errors.LOCKED:
					toast.update(id, {
						progress: 0,
						hideProgressBar: true,
						isLoading: false,
						autoClose: 5000,
						type: "error",
						render: LL.MODEL_LOCKED(),
					});
					console.log("model locked");
					break;
				default:
					assertUnreachable(error.code);
			}

			return Promise.reject(filesRes.error);
		}

		toast.update(id, {
			progress: 0,
			hideProgressBar: true,
			isLoading: false,
			autoClose: 3000,
			type: "success",
			render: LL.UPLOAD_SUCCESS(),
		});
	}

	return updateAnnotationFile;
}
