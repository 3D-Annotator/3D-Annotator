import { PointCloud } from "./model/PointCloud";
import { Scene } from "./Scene";

/**
 * A Scene for a point cloud
 */
export class PointCloudScene extends Scene<PointCloud> {
	protected createModel(): PointCloud {
		return new PointCloud();
	}
}
