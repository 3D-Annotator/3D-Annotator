import { useI18nContext } from "i18n/i18n-react";
import { useState } from "react";
import { DEFAULT_OPACITY } from "~annotator/scene/visualizer/AnnotationVisualizer";
import { LockClosed } from "~assets/icons/LockClosed";
import { LockOpen } from "~assets/icons/LockOpen";
import { type Label } from "~entity/Annotation";
import { useAnnotator } from "~ui/annotator/contexts/AnnotatorContext";
import { useLabels } from "~ui/annotator/hooks/Labels";
import { StandardContainer } from "~ui/components/StandardContainer";

export function LabelMenu() {
	const { LL } = useI18nContext();
	const annotator = useAnnotator();
	const { labels, currentLabel, isEraserSelected, notifyLabelChange } =
		useLabels();

	const [opacity, setOpacity] = useState<number>(DEFAULT_OPACITY);

	function onLabelOpacityChange(opacity: number): void {
		annotator!.changeVisualizerOpacity(opacity);
		setOpacity(opacity);
	}

	const [collapsed, setCollapsed] = useState(true);

	const labelElements = labels.map((element) => (
		<LabelMenuItem
			label={element}
			notifyLabelChange={notifyLabelChange}
			key={element.id}
		/>
	));

	return (
		<div className={`absolute right-8 top-24 h-fit w-60 rounded-3xl`}>
			<StandardContainer
				styling={`border-2 ${
					isEraserSelected ? "border-base-300" : "border-info"
				}`}
			>
				<div className={`p-2 `}>
					<div
						onClick={() => {
							if (!isEraserSelected) {
								setCollapsed((currentState) => !currentState);
							}
						}}
					>
						{currentLabel && (
							<div className="select-none">
								<LabelMenuItem
									label={currentLabel}
									notifyLabelChange={notifyLabelChange}
									key={currentLabel.id}
								/>
							</div>
						)}
					</div>

					<div className={collapsed ? "hidden" : ""}>
						<div className="divider my-0" />

						<ul className="">{labelElements}</ul>

						<div className="divider my-0" />

						<div className="flex place-content-between p-2">
							<div>
								<p>{LL.OPACITY()}</p>
							</div>
							<div>{Math.trunc(opacity * 100)}%</div>
						</div>
						<div className="px-2">
							<input
								type="range"
								min={0}
								max={100}
								step={1}
								value={opacity * 100}
								className="range range-primary range-xs"
								onChange={({ target }) => {
									onLabelOpacityChange(+target.value / 100);
								}}
							/>
						</div>
					</div>
				</div>
			</StandardContainer>
		</div>
	);
}

export interface LabelMenuItemProps {
	label: Label;
	notifyLabelChange: () => void;
}

export function LabelMenuItem({
	label,
	notifyLabelChange,
}: LabelMenuItemProps) {
	const annotator = useAnnotator();
	const { LL } = useI18nContext();

	function onLabelSelected(label: Label) {
		if (!annotator) return;
		if (!label.annotationVisible) {
			label.annotationVisible = true;
			annotator.notifyVisualizerChange();
		}

		annotator.labelManager.selectLabel(label);
	}

	function onLabelLocked(label: Label): void {
		label.locked = !label.locked;
		notifyLabelChange();
	}

	function onLabelHideAnnotation(label: Label): void {
		if (!annotator) return;
		label.annotationVisible = !label.annotationVisible;
		annotator.notifyVisualizerChange();
		notifyLabelChange();
	}

	const labelCircleStyles = {
		backgroundColor: label.annotationVisible
			? label.color.asHTMLCode()
			: undefined,
		borderColor: label.color.asHTMLCode(),
	};

	return (
		<div
			className="flex cursor-pointer items-center gap-4 p-2"
			onClick={() => {
				onLabelSelected(label);
			}}
		>
			<div
				className={
					"text-ne tooltip tooltip-left h-6 w-6 shrink-0 rounded-full border-2 border-solid"
				}
				data-tip={LL.SHOW_HIDE()}
				style={labelCircleStyles}
				onClick={(e) => {
					e.stopPropagation();
					onLabelHideAnnotation(label);
				}}
			></div>
			<div className="w-24 grow">{label.name}</div>
			{onLabelLocked !== undefined && (
				<div
					className="h-6 w-6 shrink-0 select-none text-base-content"
					onClick={(e) => {
						e.stopPropagation();
						onLabelLocked(label);
					}}
				>
					{label.locked ? <LockClosed /> : <LockOpen />}
				</div>
			)}
		</div>
	);
}
