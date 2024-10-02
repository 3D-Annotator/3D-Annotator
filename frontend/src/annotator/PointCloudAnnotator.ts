import { type AnnotationManager } from "./annotation/AnnotationManager";
import { type UndoManager } from "./annotation/undo/UndoManager";
import { Annotator } from "./Annotator";
import { type PointCloud } from "./scene/model/PointCloud";
import { PointCloudScene } from "./scene/PointCloudScene";
import { type Scene } from "./scene/Scene";
import { type AnnotationVisualizer } from "./scene/visualizer/AnnotationVisualizer";
import { PointCloudAnnotationVisualizer } from "./scene/visualizer/PointCloudAnnotationVisualizer";
import { PointCloudToolManager } from "./tools/point_cloud/PointCloudToolManager";
import { type ToolManager } from "./tools/ToolManger";

/**
 * The Annotator for PointClouds
 */
export class PointCloudAnnotator extends Annotator<PointCloud> {
	protected createToolManager(
		annotationManager: AnnotationManager,
		undoManager: UndoManager,
		scene: Scene<PointCloud>
	): ToolManager<PointCloud> {
		return new PointCloudToolManager(annotationManager, undoManager, scene);
	}

	protected createScene(sceneParent: HTMLDivElement): Scene<PointCloud> {
		return new PointCloudScene(sceneParent);
	}

	protected createAnnotationVisualizer(
		scene: Scene<PointCloud>
	): AnnotationVisualizer {
		return new PointCloudAnnotationVisualizer(scene);
	}
}
