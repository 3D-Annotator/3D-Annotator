import type { LoadingError, LoadingState } from "~ui/annotator/hooks/Setup";

interface Props {
	loadingState: LoadingState;
	error: LoadingError;
}

export function LoadingState({ loadingState }: Props) {
	return (
		<div
			className={`absolute top-1/2 left-1/2 -translate-x-1/2 transform ${
				!loadingState.loading && "hidden"
			}`}
		>
			<progress
				className="progress progress-primary h-4 w-96"
				value={
					loadingState.progress ? loadingState.progress : undefined
				}
				max={100}
			></progress>
			<p className="text-right text-lg text-slate-50">
				{loadingState.message}
			</p>
		</div>
	);
}
