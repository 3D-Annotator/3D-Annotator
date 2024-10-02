import { type AnnotationManager } from "./annotation/AnnotationManager";
import { type UndoManager } from "./annotation/undo/UndoManager";
import { Annotator } from "./Annotator";
import { MeshScene } from "./scene/MeshScene";
import { type Mesh } from "./scene/model/Mesh";
import { type Scene } from "./scene/Scene";
import { type AnnotationVisualizer } from "./scene/visualizer/AnnotationVisualizer";
import { MeshAnnotationVisualizer } from "./scene/visualizer/MeshAnnotationVisualizer";
import { MeshToolManager } from "./tools/mesh/MeshToolManager";
import { type ToolManager } from "./tools/ToolManger";

/**
 * The Annotator for Meshes
 */
export class MeshAnnotator extends Annotator<Mesh> {
	protected createToolManager(
		annotationManager: AnnotationManager,
		undoManager: UndoManager,
		scene: Scene<Mesh>
	): ToolManager<Mesh> {
		return new MeshToolManager(annotationManager, undoManager, scene);
	}

	protected createScene(sceneParent: HTMLDivElement): Scene<Mesh> {
		return new MeshScene(sceneParent);
	}

	protected createAnnotationVisualizer(
		scene: Scene<Mesh>
	): AnnotationVisualizer {
		return new MeshAnnotationVisualizer(scene);
	}
}
