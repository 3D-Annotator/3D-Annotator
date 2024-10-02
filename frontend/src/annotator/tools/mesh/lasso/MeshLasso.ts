import { getI18NContext } from "i18n/vanilla-context";
import {
	BufferGeometry,
	Float32BufferAttribute,
	Line,
	Line3,
	LineBasicMaterial,
	Matrix4,
	Vector2,
	Vector3,
	type Mesh as ThreeMesh,
} from "three";
import {
	CONTAINED,
	INTERSECTED,
	NOT_INTERSECTED,
	type ExtendedTriangle,
} from "three-mesh-bvh";
import { type AnnotationManager } from "~annotator/annotation/AnnotationManager";
import { type UndoManager } from "~annotator/annotation/undo/UndoManager";
import { getHeightAt, getWidthAt } from "~annotator/scene/Camera";
import { type Scene } from "~annotator/scene/Scene";
import { type Mesh } from "~annotator/scene/model/Mesh";
import { Tool } from "~annotator/tools/Tool";
import {
	type ListenerBundle,
	type ListenerConfig,
} from "~annotator/tools/common/listener/Listener";
import {
	getConvexHull,
	lineCrossesLine,
	pointRayCrossesSegments,
} from "~annotator/tools/common/math/MathUtils";
import { assertUnreachable } from "~util/TypeScript";
import { MeshLassoButton } from "./MeshLassoButton";
import { MeshLassoQuickSettingsView } from "./MeshLassoQuickSettingsView";

const LL = getI18NContext();

export const SELECTION_MODES = [
	{
		name: "centroid",
		displayName: LL.CENTROID(),
		description: LL.CENTROID_DESCRIPTION(),
	},
	{
		name: "intersection",
		displayName: LL.INTERSECTION(),
		description: LL.INTERSECTION_DESCRIPTION(),
	},
	{
		name: "contain",
		displayName: LL.CONTAIN(),
		description: LL.CONTAIN_DESCRIPTION(),
	},
] as const;

export interface Parameters {
	selectionMode: (typeof SELECTION_MODES)[number]["name"];
}

const NAME = "MESH_LASSO";
const DISTANCE_FROM_CAMERA = 0.1;

/**
 * A lasso tool to select point cloud data
 * (inspired by https://github.com/gkjohnson/three-mesh-bvh)
 */
export class MeshLasso extends Tool<Mesh> {
	public readonly parameters: Parameters = {
		selectionMode: "centroid",
	};

	private selectionShape!: Line;
	private selectionPoints: number[] = [];
	private selectionShapeNeedsUpdate = false;
	private selectionNeedsUpdate = false;
	private pressed = false;
	private bvhMesh?: ThreeMesh;

	// handle building lasso shape
	private prevX = -Infinity;
	private prevY = -Infinity;

	private tempVector0 = new Vector2();
	private tempVector1 = new Vector2();
	private tempVector2 = new Vector2();

	/**
	 * The configuration for the PointerMoveListener
	 */
	private pointerMoveListenerConfig: ListenerConfig<"pointermove"> = {
		name: "pointermove",
		listener: this.pointerMoveListener.bind(this),
	};

	/**
	 * The configuration for the PointerDownListener
	 */
	private pointerDownListenerConfig: ListenerConfig<"pointerdown"> = {
		name: "pointerdown",
		listener: this.pointerDownListener.bind(this),
	};

	/**
	 * The configuration for the PointerUpListener
	 */
	private pointerUpListenerConfig: ListenerConfig<"pointerup"> = {
		name: "pointerup",
		listener: this.pointerUpListener.bind(this),
	};

	/**
	 * The Listener configurations
	 */
	private listenerConfigs = {
		configs: [
			this.pointerMoveListenerConfig,
			this.pointerDownListenerConfig,
			this.pointerUpListenerConfig,
		],
	};

	constructor(
		annotationManager: AnnotationManager,
		undoManager: UndoManager,
		scene: Scene<Mesh>
	) {
		super(NAME, annotationManager, undoManager, scene);
	}

	protected override getOnSelectedListenerBundles(): ListenerBundle[] {
		return [this.listenerConfigs];
	}

	protected override onLoad(): void {
		// selection shape
		this.selectionShape = new Line(
			new BufferGeometry(),
			new LineBasicMaterial({ color: "#ff9800" })
		);
		this.selectionShape.renderOrder = 1;
		this.selectionShape.position.z = -DISTANCE_FROM_CAMERA;
	}

	protected override onDispose(): void {
		for (const camera of this.scene.cameras) {
			camera.remove(this.selectionShape);
		}
		this.selectionShape.geometry.dispose();
	}

	protected override onSelected(): void {
		this.scene.camera.add(this.selectionShape);
	}

	protected override onUpdate(): void {
		this.bvhMesh = this.scene.getModel().getMesh();
		if (this.selectionShapeNeedsUpdate) {
			const ogLength = this.selectionPoints.length;
			this.selectionPoints.push(
				this.selectionPoints[0],
				this.selectionPoints[1],
				this.selectionPoints[2]
			);

			this.selectionShape.geometry.setAttribute(
				"position",
				new Float32BufferAttribute(this.selectionPoints, 3, false)
			);

			this.selectionPoints.length = ogLength;

			// always render, even when not in sight
			this.selectionShape.frustumCulled = false;
			this.selectionShapeNeedsUpdate = false;
		}

		if (this.selectionNeedsUpdate) {
			this.selectionNeedsUpdate = false;

			if (this.selectionPoints.length > 0) {
				this.updateSelection();
				if (!this.pressed) {
					this.undoManager.endGroup();
				}
			}
		}

		this.selectionShape.scale.set(
			getWidthAt(this.scene.camera, DISTANCE_FROM_CAMERA),
			getHeightAt(this.scene.camera, DISTANCE_FROM_CAMERA),
			1
		);
	}

	protected override onUnselected(): void {
		this.scene.camera.remove(this.selectionShape);
	}

	public getToolButtonComponent() {
		return MeshLassoButton;
	}

	public getQuickSettingsComponent() {
		return MeshLassoQuickSettingsView;
	}

	/**
	 * The PointerUpListener
	 */
	private pointerUpListener() {
		this.pressed = false;
		this.selectionShape.visible = false;
		if (this.selectionPoints.length) {
			this.selectionNeedsUpdate = true;
		}
	}

	/**
	 * The PointerDownListener
	 */
	private pointerDownListener(event: PointerEvent) {
		this.undoManager.startGroup();
		this.pressed = true;
		this.prevX = event.clientX;
		this.prevY = event.clientY;
		this.selectionPoints.length = 0;
	}

	/**
	 * The PointerMoveListener
	 */
	private pointerMoveListener(event: PointerEvent) {
		// If the left mouse button is not pressed
		if ((1 & event.buttons) === 0) {
			return;
		}

		const ex = event.clientX;
		const ey = event.clientY;

		const nx = (event.clientX / window.innerWidth) * 2 - 1;
		const ny = -((event.clientY / window.innerHeight) * 2 - 1);

		// If the mouse hasn't moved a lot since the last point
		if (Math.abs(ex - this.prevX) >= 3 || Math.abs(ey - this.prevY) >= 3) {
			// Check if the mouse moved in roughly the same direction as the previous point
			// and replace it if so.
			const i = this.selectionPoints.length / 3 - 1;
			const i3 = i * 3;
			let doReplace = false;
			if (this.selectionPoints.length > 3) {
				// prev segment direction
				this.tempVector0.set(
					this.selectionPoints[i3 - 3],
					this.selectionPoints[i3 - 3 + 1]
				);
				this.tempVector1.set(
					this.selectionPoints[i3],
					this.selectionPoints[i3 + 1]
				);
				this.tempVector1.sub(this.tempVector0).normalize();

				// this segment direction
				this.tempVector0.set(
					this.selectionPoints[i3],
					this.selectionPoints[i3 + 1]
				);
				this.tempVector2.set(nx, ny);
				this.tempVector2.sub(this.tempVector0).normalize();

				const dot = this.tempVector1.dot(this.tempVector2);
				doReplace = dot > 0.99;
			}

			if (doReplace) {
				this.selectionPoints[i3] = nx;
				this.selectionPoints[i3 + 1] = ny;
			} else {
				this.selectionPoints.push(nx, ny, 0);
			}

			this.selectionShapeNeedsUpdate = true;
			this.selectionShape.visible = true;

			this.prevX = ex;
			this.prevY = ey;
		}
	}

	private toScreenSpaceMatrix = new Matrix4();
	private boxPoints = new Array(8).fill(0).map(() => new Vector3());
	private boxLines = new Array(12).fill(0).map(() => new Line3());
	private lassoSegments: Line3[] = [];
	private perBoundsSegments: Line3[][] = [];

	/**
	 * Updates the selection for all intersecting pints
	 */
	private updateSelection() {
		// TODO: Possible improvements
		// - Correctly handle the camera near clip
		// - Improve line line intersect performance?

		const camera = this.scene.camera;

		this.toScreenSpaceMatrix
			.copy(this.bvhMesh!.matrixWorld)
			.premultiply(camera.matrixWorldInverse)
			.premultiply(camera.projectionMatrix);

		// create scratch points and lines to use for selection
		while (this.lassoSegments.length < this.selectionPoints.length) {
			this.lassoSegments.push(new Line3());
		}
		this.lassoSegments.length = this.selectionPoints.length;

		for (let s = 0, l = this.selectionPoints.length; s < l; s += 3) {
			const line = this.lassoSegments[s];
			const sNext = (s + 3) % l;
			line.start.x = this.selectionPoints[s];
			line.start.y = this.selectionPoints[s + 1];

			line.end.x = this.selectionPoints[sNext];
			line.end.y = this.selectionPoints[sNext + 1];
		}

		const indices: number[] = [];
		this.bvhMesh!.geometry.boundsTree!.shapecast({
			intersectsBounds: (
				box: {
					min: Vector3;
					max: Vector3;
				},
				isLeaf: boolean,
				score,
				depth: number
			) => {
				// Get the bounding box points
				const { min, max } = box;
				let index = 0;

				let minY = Infinity;
				let maxY = -Infinity;
				let minX = Infinity;
				for (let x = 0; x <= 1; x++) {
					for (let y = 0; y <= 1; y++) {
						for (let z = 0; z <= 1; z++) {
							const v = this.boxPoints[index];
							v.x = x === 0 ? min.x : max.x;
							v.y = y === 0 ? min.y : max.y;
							v.z = z === 0 ? min.z : max.z;

							v.applyMatrix4(this.toScreenSpaceMatrix);
							index++;

							if (v.y < minY) minY = v.y;
							if (v.y > maxY) maxY = v.y;
							if (v.x < minX) minX = v.x;
						}
					}
				}

				// Find all the relevant segments here and cache them in the above array for
				// subsequent child checks to use.
				const parentSegments =
					this.perBoundsSegments[depth - 1] || this.lassoSegments;
				const segmentsToCheck = this.perBoundsSegments[depth] || [];
				segmentsToCheck.length = 0;
				this.perBoundsSegments[depth] = segmentsToCheck;
				for (let i = 0, l = parentSegments.length; i < l; i++) {
					const line = parentSegments[i];
					const sx = line.start.x;
					const sy = line.start.y;
					const ex = line.end.x;
					const ey = line.end.y;
					if (sx < minX && ex < minX) continue;

					const startAbove = sy > maxY;
					const endAbove = ey > maxY;
					if (startAbove && endAbove) continue;

					const startBelow = sy < minY;
					const endBelow = ey < minY;
					if (startBelow && endBelow) continue;

					segmentsToCheck.push(line);
				}

				if (segmentsToCheck.length === 0) {
					return NOT_INTERSECTED;
				}

				// Get the screen space hull lines
				const hull = getConvexHull(this.boxPoints);
				if (!hull) {
					// this works?
					return INTERSECTED;
				}

				const lines = hull.map((p, i) => {
					const nextP = hull[(i + 1) % hull.length];
					const line = this.boxLines[i];
					line.start.copy(p);
					line.end.copy(nextP);
					return line;
				});

				// If a lasso point is inside the hull then it's intersected and cannot be contained
				if (
					pointRayCrossesSegments(segmentsToCheck[0].start, lines) %
						2 ===
					1
				) {
					return INTERSECTED;
				}

				// check if the screen space hull is in the lasso
				let crossings = 0;
				for (let i = 0, l = hull.length; i < l; i++) {
					const v = hull[i];
					const pCrossings = pointRayCrossesSegments(
						v,
						segmentsToCheck
					);

					if (i === 0) {
						crossings = pCrossings;
					}

					// if two points on the hull have different amounts of crossings then
					// it can only be intersected
					if (crossings !== pCrossings) {
						return INTERSECTED;
					}
				}

				// check if there are any intersections
				for (let i = 0, l = lines.length; i < l; i++) {
					const boxLine = lines[i];
					for (let s = 0, ls = segmentsToCheck.length; s < ls; s++) {
						if (lineCrossesLine(boxLine, segmentsToCheck[s])) {
							return INTERSECTED;
						}
					}
				}

				return crossings % 2 === 0 ? NOT_INTERSECTED : CONTAINED;
			},

			intersectsTriangle: (
				triangle: ExtendedTriangle,
				index: number,
				contained: boolean,
				depth: number
			) => {
				// if the parent bounds were marked as contained
				if (contained) {
					indices.push(index);
					return false;
				}

				// check all the segments if using no bounds tree
				const segmentsToCheck = this.perBoundsSegments[depth];
				const vertices = [triangle.a, triangle.b, triangle.c];

				switch (this.parameters.selectionMode) {
					case "centroid": {
						// get the center of the triangle
						const centroid = triangle.a
							.add(triangle.b)
							.add(triangle.c)
							.multiplyScalar(1 / 3);
						centroid.applyMatrix4(this.toScreenSpaceMatrix);

						// counting the crossings
						const crossings = pointRayCrossesSegments(
							centroid,
							segmentsToCheck
						);
						if (crossings % 2 === 1) {
							indices.push(index);
							return false;
						}
						break;
					}
					case "contain": {
						// get the projected vertices

						for (let j = 0; j < 3; j++) {
							const v = vertices[j];
							v.applyMatrix4(this.toScreenSpaceMatrix);

							const crossings = pointRayCrossesSegments(
								v,
								segmentsToCheck
							);
							if (crossings % 2 !== 1) {
								return false;
							}
						}
						indices.push(index);
						break;
					}
					case "intersection": {
						for (let j = 0; j < 3; j++) {
							const v = vertices[j];
							v.applyMatrix4(this.toScreenSpaceMatrix);

							const crossings = pointRayCrossesSegments(
								v,
								segmentsToCheck
							);
							if (crossings % 2 === 1) {
								indices.push(index);
								return false;
							}
						}

						// get the lines for the triangle
						const lines = [
							this.boxLines[0],
							this.boxLines[1],
							this.boxLines[2],
						];

						lines[0].start.copy(triangle.a);
						lines[0].end.copy(triangle.b);

						lines[1].start.copy(triangle.b);
						lines[1].end.copy(triangle.c);

						lines[2].start.copy(triangle.c);
						lines[2].end.copy(triangle.a);

						for (let i = 0; i < 3; i++) {
							const l = lines[i];
							for (const segment of segmentsToCheck) {
								if (lineCrossesLine(l, segment)) {
									indices.push(index);
									return false;
								}
							}
						}
						break;
					}
					default:
						assertUnreachable(this.parameters.selectionMode);
				}
				return false;
			},
		});

		if (indices.length) {
			const translatedIndices = this.scene
				.getModel()
				.translateBVHIndices(indices);
			this.annotationManager.annotate(translatedIndices);
		}
	}
}
