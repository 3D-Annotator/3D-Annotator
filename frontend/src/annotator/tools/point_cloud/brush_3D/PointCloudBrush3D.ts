import {
	Matrix4,
	Raycaster,
	Vector3,
	type Box3,
	type Mesh as ThreeMesh,
} from "three";
import { INTERSECTED, NOT_INTERSECTED } from "three-mesh-bvh";
import { type AnnotationManager } from "~annotator/annotation/AnnotationManager";
import { type UndoManager } from "~annotator/annotation/undo/UndoManager";
import { getHeightAt } from "~annotator/scene/Camera";
import { type Scene } from "~annotator/scene/Scene";
import { type PointCloud } from "~annotator/scene/model/PointCloud";
import { Tool } from "~annotator/tools/Tool";
import { Sphere } from "~annotator/tools/common/elements/sphere/Sphere";
import { type ListenerBundle } from "~annotator/tools/common/listener/Listener";
import { MouseButtons } from "~annotator/tools/common/listener/PointerListenerBundle";
import { PointerUndoHandler } from "~annotator/tools/common/undo/PointerUndoHandler";
import { PointCloudBrush3DButton } from "./PointCloudBrush3DButton";
import { PointCloudBrush3DQuickSettingsView } from "./PointCloudBrush3DQuickSettingsView";

export interface Parameters {
	size: number;
	raycastThreshold: number;
}

const NAME = "POINT_CLOUD_BRUSH_3D";

/**
 * A brush tool to select point clouds
 * (inspired by https://github.com/gkjohnson/three-mesh-bvh)
 */
export class PointCloudBrush3D extends Tool<PointCloud> {
	public readonly parameters: Parameters = {
		size: Sphere.DEFAULT_SCALE,
		raycastThreshold: 0.1,
	};

	private undoHandler = new PointerUndoHandler(this.undoManager);
	// initialized in this.onLoad()
	private brush!: Sphere;
	private initialBrushFactor!: number;

	// initialized in this.onUpdate()
	private bvhMesh!: ThreeMesh;

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

	protected override onLoad(): void {
		this.brush = new Sphere();
		this.initialBrushFactor = this.calculateBrushFactor();
	}

	private calculateBrushFactor(): number {
		const distance = this.scene
			.getCameraControls()
			.getPerspectiveDistance();
		return getHeightAt(this.scene.camera, distance);
	}

	protected override onSelected(): void {
		this.scene.addSceneSubject(this.brush);
	}

	protected override onUpdate(): void {
		this.bvhMesh = this.scene.getModel().getBVHMesh();

		this.updateBrush();
		this.undoHandler.onUpdate(this.pointer);

		if (
			this.pointer.buttons === MouseButtons.PRIMARY &&
			this.brush.isVisible()
		) {
			this.annotate();
		}
	}

	protected override onUnselected(): void {
		this.scene.removeSceneSubject(this.brush);
	}

	protected override onDispose(): void {
		this.brush.dispose();
	}

	private updateBrush() {
		this.brush.setScale(this.parameters.size, this.initialBrushFactor);

		if (!this.pointer.hasMoved) {
			return;
		}

		const selectedPoint = this.selectPoint();

		if (!selectedPoint) {
			this.brush.setInvisible();
		} else {
			this.brush.setPosition(selectedPoint);
			this.brush.getPosition().applyMatrix4(this.bvhMesh.matrixWorld);
			this.brush.setVisible();
		}
	}

	/**
	 * Selects position where to select in the point cloud
	 *
	 * @returns the the position
	 */
	private selectPoint(): Vector3 | null {
		const raycaster = new Raycaster();
		raycaster.setFromCamera(this.pointer.position, this.scene.camera);

		const inverseMatrix = new Matrix4();
		inverseMatrix.copy(this.bvhMesh.matrixWorld).invert();
		raycaster.ray.applyMatrix4(inverseMatrix);

		const threshold = this.parameters.raycastThreshold;
		const localThreshold =
			threshold /
			((this.bvhMesh.scale.x +
				this.bvhMesh.scale.y +
				this.bvhMesh.scale.z) /
				3);
		const localThresholdSq = localThreshold * localThreshold;
		let selectionPosition = null;

		const { ray } = raycaster;
		let closestDistance = Infinity;
		this.bvhMesh.geometry.boundsTree!.shapecast({
			boundsTraverseOrder: (box: Box3) => {
				// traverse the closer bounds first.
				return box.distanceToPoint(ray.origin);
			},
			intersectsBounds: (box, isLeaf, score) => {
				// if we've already found a point that's closer then the full bounds then
				// don't traverse further.
				if (score! > closestDistance) {
					return NOT_INTERSECTED;
				}

				box.expandByScalar(localThreshold);
				return ray.intersectsBox(box) ? INTERSECTED : NOT_INTERSECTED;
			},
			intersectsTriangle: (triangle) => {
				const distancesToRaySq = ray.distanceSqToPoint(triangle.a);
				if (distancesToRaySq < localThresholdSq) {
					// track the closest found point distance so we can early out traversal and only
					// use the closest point along the ray.
					const distanceToPoint = ray.origin.distanceTo(triangle.a);
					if (distanceToPoint < closestDistance) {
						closestDistance = distanceToPoint;
						selectionPosition = new Vector3().copy(triangle.a);
					}
				}
			},
		});
		return selectionPosition;
	}

	/**
	 * Annotates the intersections found by the bvh intersections
	 */
	private annotate() {
		const indices = this.getSphereIntersections(this.brush.getPosition());
		const translatedIndices = this.scene
			.getModel()
			.translateBVHIndices(indices);

		this.annotationManager.annotate(translatedIndices);
	}

	/**
	 * Returns all all points intersecting with the brush sphere
	 *
	 * @param selectionPosition the selection position
	 * @returns all intersecting points
	 */
	private getSphereIntersections(selectionPosition: Vector3): number[] {
		const selectionRadius = this.brush.getEffectiveRadius();
		const selectionRadiusSq = selectionRadius * selectionRadius;
		const points: number[] = [];

		this.bvhMesh.geometry.boundsTree!.shapecast({
			intersectsBounds: (box) => {
				const boxCenter = box.getCenter(new Vector3());
				const boxRadius = box.getSize(new Vector3()).length() / 2;
				const centerToSphere = selectionPosition.distanceTo(boxCenter);

				// should return NOT_INTERSECTED / INTERSECTED / CONTAINED equivalent to 0 / 1 / 2
				return (
					+(selectionRadius > centerToSphere - boxRadius) +
					+(selectionRadius > centerToSphere + boxRadius)
				);
			},
			intersectsTriangle: (triangle, triangleIndex, contained) => {
				if (contained) {
					points.push(triangleIndex * 3);
					return false;
				}
				if (
					triangle.a.distanceToSquared(selectionPosition) <
					selectionRadiusSq
				) {
					points.push(triangleIndex * 3);
				}
				return false;
			},
		});

		return points;
	}

	public getToolButtonComponent() {
		return PointCloudBrush3DButton;
	}

	public getQuickSettingsComponent() {
		return PointCloudBrush3DQuickSettingsView;
	}
}
