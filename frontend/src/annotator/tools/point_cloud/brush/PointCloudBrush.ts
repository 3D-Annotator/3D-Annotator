import { Matrix4, Raycaster, Vector3, type Mesh as ThreeMesh } from "three";
import type { UndoManager } from "~annotator/annotation/undo/UndoManager";
import { getHeightAt, getWidthAt } from "~annotator/scene/Camera";
import { Circle } from "~annotator/tools/common/elements/circle/Circle";
import { PointerUndoHandler } from "~annotator/tools/common/undo/PointerUndoHandler";
import type { AnnotationManager } from "../../../annotation/AnnotationManager";
import { type Scene } from "../../../scene/Scene";
import { type PointCloud } from "../../../scene/model/PointCloud";
import { Tool, type Cursor } from "../../Tool";
import { type ListenerBundle } from "../../common/listener/Listener";
import { MouseButtons } from "../../common/listener/PointerListenerBundle";
import { PointCloudBrushButton } from "./PointCloudBrushButton";
import { PointCloudBrushQuickSettingsView } from "./PointCloudBrushQuickSettingsView";

const NAME = "POINT_CLOUD_BRUSH";
const DISTANCE_FROM_CAMERA = 0.1;
const CURSOR: Cursor = "none";

/**
 * A spotlight tool to select points of point clouds.
 * (inspired by https://github.com/gkjohnson/three-mesh-bvh)
 */
export class PointCloudBrush extends Tool<PointCloud> {
	public readonly params = {
		raycastThreshold: 0.005,
		size: 0.1,
		useBVH: true,
	};

	private bvhMesh?: ThreeMesh;

	private circle!: Circle;

	private undoHandler = new PointerUndoHandler(this.undoManager);

	constructor(
		annotationManager: AnnotationManager,
		undoManager: UndoManager,
		scene: Scene<PointCloud>
	) {
		super(NAME, annotationManager, undoManager, scene);
	}

	protected override getOnSelectedListenerBundles(): ListenerBundle[] {
		return [this.pointerListenerBundle];
	}

	public override getCursor(): Cursor {
		return CURSOR;
	}

	protected onLoad(): void {
		this.circle = new Circle();
	}

	protected onSelected(): void {
		this.scene.camera.add(...this.circle.getObjects());
	}

	protected onUpdate(): void {
		this.bvhMesh = this.scene.getModel().getBVHMesh();

		const height = getHeightAt(this.scene.camera, DISTANCE_FROM_CAMERA);

		this.circle.setScale(this.params.size, height);

		if (this.pointer.hasMoved) {
			if (!this.circle.isVisible()) {
				this.circle.setVisible();
			}
		}

		/*
		 * `width` depends on fov/zoom which can change anytime.
		 * Therefore the position needs to be updated every frame.
		 */
		const width = getWidthAt(this.scene.camera, DISTANCE_FROM_CAMERA);
		this.circle.setPosition(
			width * this.pointer.position.x,
			height * this.pointer.position.y,
			-DISTANCE_FROM_CAMERA
		);

		this.undoHandler.onUpdate(this.pointer);

		if (this.pointer.buttons === MouseButtons.PRIMARY) {
			this.annotate();
		}
	}

	protected onUnselected(): void {
		this.scene.camera.remove(...this.circle.getObjects());
	}

	protected onDispose(): void {
		for (const camera of this.scene.cameras) {
			camera.remove(...this.circle.getObjects());
		}
		this.circle.dispose();
	}

	/**
	 * Annotates the intersections found by the bvh intersections
	 */
	private annotate() {
		const indices = this.getLightIntersections();
		const translatedIndices = this.scene
			.getModel()
			.translateBVHIndices(indices);

		this.annotationManager.annotate(translatedIndices);
	}

	private getLightIntersections(): number[] {
		const raycaster = new Raycaster();
		raycaster.setFromCamera(this.pointer.position, this.scene.camera);

		const size = this.params.size;

		const inverseMatrix = new Matrix4();
		inverseMatrix.copy(this.bvhMesh!.matrixWorld).invert();
		raycaster.ray.applyMatrix4(inverseMatrix);
		const { ray } = raycaster;

		// if (this.camera.isOrthographicCamera) {
		// 	return [];
		// }

		const cameraFactor = getHeightAt(this.scene.camera, 1);

		const points: number[] = [];
		let maxDistanceSq = 0;

		this.bvhMesh!.geometry.boundsTree!.shapecast({
			intersectsBounds: (box) => {
				const boxCenter = box.getCenter(new Vector3());
				const nearestPoint = ray.closestPointToPoint(
					boxCenter,
					new Vector3()
				);
				const rayDist = nearestPoint.distanceTo(ray.origin);
				const factor = this.scene.camera.isPerspectiveCamera
					? rayDist
					: 1;
				const maxDistance = size * (factor * cameraFactor);

				const boxRadius = box.getSize(new Vector3()).length() / 2;
				const centerToRayDist = nearestPoint.distanceTo(boxCenter);

				const intersected =
					+(maxDistance > centerToRayDist - boxRadius) +
					+(maxDistance > centerToRayDist + boxRadius);

				maxDistanceSq = maxDistance * maxDistance;

				return +intersected;
			},
			intersectsTriangle: (triangle, triangleIndex, contained) => {
				if (
					contained ||
					ray.distanceSqToPoint(triangle.a) < maxDistanceSq
				) {
					points.push(triangleIndex * 3);
				}
				return false;
			},
		});
		return points;
	}

	public getToolButtonComponent() {
		return PointCloudBrushButton;
	}

	public getQuickSettingsComponent() {
		return PointCloudBrushQuickSettingsView;
	}
}
