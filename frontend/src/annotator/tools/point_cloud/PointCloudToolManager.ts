import { type PointCloud } from "~annotator/scene/model/PointCloud";
import { type Tool } from "../Tool";
import { ToolManager } from "../ToolManger";
import { PointCloudBrush } from "./brush/PointCloudBrush";
import { PointCloudBrush3D } from "./brush_3D/PointCloudBrush3D";
import { PointCloudLasso } from "./lasso/PointCloudLasso";

/**
 * A Manager for all point cloud tools
 */
export class PointCloudToolManager extends ToolManager<PointCloud> {
	/**
	 * Creates all tools compatible with the model type {@link PointCloud}
	 *
	 * @returns the array of tools
	 */
	protected createTools(): Tool<PointCloud>[] {
		return [
			new PointCloudBrush(
				this.annotationManager,
				this.undoManager,
				this.scene
			),
			new PointCloudLasso(
				this.annotationManager,
				this.undoManager,
				this.scene
			),
			new PointCloudBrush3D(
				this.annotationManager,
				this.undoManager,
				this.scene
			),
		];
	}
}
