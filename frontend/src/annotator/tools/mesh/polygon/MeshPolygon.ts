import { getI18NContext } from "i18n/vanilla-context";
import {
	BufferGeometry,
	Float32BufferAttribute,
	Line,
	Line3,
	LineBasicMaterial,
	Matrix4,
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
import { type Observer, type Unsubscribe } from "~entity/Types";
import { assertUnreachable } from "~util/TypeScript";
import { MeshPolygonButton } from "./MeshPolygonButton";
import { MeshPolygonHelpContent } from "./MeshPolygonHelpContent";
import { MeshPolygonQuickSettingsView } from "./MeshPolygonQuickSettingsView";

export enum PolygonToolState {
	INACTIVE,
	ACTIVE,
	SELECTED,
}
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

export const MIN_POINTS = 3;

interface Parameters {
	selectionMode: (typeof SELECTION_MODES)[number]["name"];
}

const NAME = "MESH_POLYGON";

const LINE_COLOR = "#ff9800";
const DISTANCE_FROM_CAMERA = 0.1;

/**
 * A polygon tool to select mesh data
 * (inspired by https://github.com/gkjohnson/three-mesh-bvh)
 */
export class MeshPolygon extends Tool<Mesh> {
	public parameters: Parameters = {
		selectionMode: "centroid",
	};

	// initialized in onLoad()
	private mesh!: ThreeMesh;

	private selectedPoints: number[] = [];
	// initialized in onLoad()
	private selectionShape!: Line<BufferGeometry, LineBasicMaterial>;
	private selectionShapeNeedsUpdate = false;

	private state = PolygonToolState.INACTIVE;
	private preview = false;

	private readonly stateObservers = new Set<Observer<PolygonToolState>>();

	private pointerMoveListenerConfig: ListenerConfig<"pointermove"> = {
		name: "pointermove",
		listener: this.pointerMoveListener.bind(this),
	};

	private pointerDownListenerConfig: ListenerConfig<"pointerup"> = {
		name: "pointerup",
		listener: this.pointerUpListener.bind(this),
	};

	private keyDownListenerBound = this.keyDownListener.bind(this);
	private keyUpListenerBound = this.keyUpListener.bind(this);

	private listenerBundle = {
		configs: [
			this.pointerMoveListenerConfig,
			this.pointerDownListenerConfig,
		],
	};

	constructor(
		annotationManager: AnnotationManager,
		undoManager: UndoManager,
		scene: Scene<Mesh>
	) {
		super(NAME, annotationManager, undoManager, scene);
	}

	public addStateObserver(observer: Observer<PolygonToolState>): Unsubscribe {
		this.stateObservers.add(observer);
		return () => {
			this.stateObservers.delete(observer);
		};
	}

	private setState(state: PolygonToolState) {
		this.state = state;
		this.notifyStateObservers();
	}

	private notifyStateObservers() {
		for (const observer of this.stateObservers) {
			observer(this.state);
		}
	}

	public override getToolButtonComponent() {
		return MeshPolygonButton;
	}

	public override getQuickSettingsComponent() {
		return MeshPolygonQuickSettingsView;
	}

	public override getHelpContentComponent() {
		return MeshPolygonHelpContent;
	}

	protected override getOnSelectedListenerBundles(): ListenerBundle[] {
		return [this.pointerListenerBundle, this.listenerBundle];
	}

	protected override onLoad(): void {
		this.mesh = this.scene.getModel().getMesh();
		this.selectionShape = new Line(
			new BufferGeometry(),
			new LineBasicMaterial({ color: LINE_COLOR })
		);
		this.selectionShape.renderOrder = 1;
		this.selectionShape.position.z = -DISTANCE_FROM_CAMERA;
	}

	protected override onDispose(): void {
		for (const camera of this.scene.cameras) {
			camera.remove(this.selectionShape);
		}
		this.selectionShape.geometry.dispose();
		this.stateObservers.clear();
	}

	protected override onSelected(): void {
		this.scene.camera.add(this.selectionShape);
		document.addEventListener("keydown", this.keyDownListenerBound);
		document.addEventListener("keyup", this.keyUpListenerBound);

		if (
			this.state === PolygonToolState.ACTIVE ||
			this.state === PolygonToolState.SELECTED
		) {
			this.scene.getCameraControls().disable();
		}
	}

	protected override onUnselected(): void {
		this.scene.camera.remove(this.selectionShape);
		document.removeEventListener("keydown", this.keyDownListenerBound);
		document.removeEventListener("keyup", this.keyUpListenerBound);
		this.scene.getCameraControls().enable();
	}

	protected override onUpdate(): void {
		if (this.selectionShapeNeedsUpdate) {
			this.updateSelectionShape();
			this.selectionShapeNeedsUpdate = false;
		}

		this.selectionShape.scale.set(
			getWidthAt(this.scene.camera, DISTANCE_FROM_CAMERA),
			getHeightAt(this.scene.camera, DISTANCE_FROM_CAMERA),
			1
		);
	}

	public getState(): PolygonToolState {
		return this.state;
	}

	private startPolygon(x: number, y: number): void {
		this.setState(PolygonToolState.ACTIVE);
		this.scene.getCameraControls().disable();
		this.undoManager.startGroup();
		this.selectedPoints.push(x, y, 0);
		this.selectionShape.visible = true;
	}

	public getNumberOfPoints(): number {
		const count = this.selectedPoints.length / 3;
		return this.preview ? count : count - 1;
	}

	private addPointToPolygon(x: number, y: number): void {
		this.selectedPoints.push(x, y, 0);
		this.selectionShapeNeedsUpdate = true;
		this.notifyStateObservers();
	}

	private moveLastPolygonPoint(x: number, y: number) {
		const length = this.selectedPoints.length;
		this.selectedPoints[length - 3] = x;
		this.selectedPoints[length - 2] = y;
		this.selectionShapeNeedsUpdate = true;
	}

	private removeLastPointIfPossible(): void {
		if (
			(this.preview && this.selectedPoints.length === 3) ||
			(!this.preview && this.selectedPoints.length === 6)
		) {
			return;
		}

		this.selectedPoints.length -= 3;
		this.selectionShapeNeedsUpdate = true;
		this.notifyStateObservers();
	}

	public removeLastPoint(): void {
		if (this.state === PolygonToolState.INACTIVE) {
			return;
		}

		const position = this.pointer.position;

		if (this.state === PolygonToolState.SELECTED) {
			this.moveLastPolygonPoint(position.x, position.y);
			this.setState(PolygonToolState.ACTIVE);
			return;
		}

		if (
			(this.preview && this.selectedPoints.length === 3) ||
			(!this.preview && this.selectedPoints.length === 6)
		) {
			this.endPolygon();
			return;
		}

		this.selectedPoints.length -= 3;
		this.selectionShapeNeedsUpdate = true;

		if (!this.preview) {
			this.moveLastPolygonPoint(position.x, position.y);
		}

		this.notifyStateObservers();
	}

	public concludePolygon(): void {
		if (this.getNumberOfPoints() < MIN_POINTS) {
			throw new Error(`At least ${MIN_POINTS} vertices are required.`);
		}

		if (!this.preview) {
			this.removeLastPointIfPossible();
		}

		this.setState(PolygonToolState.SELECTED);
	}

	private endPolygon(): void {
		this.scene.getCameraControls().enable();
		this.selectedPoints.length = 0;
		this.selectionShape.visible = false;
		this.setState(PolygonToolState.INACTIVE);
	}

	public annotate(): void {
		const indices = this.calculateIntersection();
		this.annotationManager.annotate(indices);
		this.undoManager.endGroup();
		this.endPolygon();
	}

	public abort(): void {
		this.endPolygon();
	}

	public showPreview(): void {
		if (this.preview) {
			return;
		}

		this.preview = true;
		this.removeLastPointIfPossible();
	}

	public hidePreview(): void {
		this.preview = false;

		if (this.state !== PolygonToolState.ACTIVE) {
			return;
		}

		const position = this.pointer.position;
		this.addPointToPolygon(position.x, position.y);
	}

	private updateSelectionShape(): void {
		const previousLength = this.selectedPoints.length;

		// connect last point with first point
		this.selectedPoints.push(
			this.selectedPoints[0],
			this.selectedPoints[1],
			this.selectedPoints[2]
		);

		this.selectionShape.geometry.setAttribute(
			"position",
			new Float32BufferAttribute(this.selectedPoints, 3, false)
		);

		this.selectedPoints.length = previousLength;

		// always render, even when not in sight
		this.selectionShape.frustumCulled = false;
	}

	private pointerUpListener(event: PointerEvent) {
		if (event.button !== 0 || this.state === PolygonToolState.SELECTED) {
			return;
		}

		const nx = (event.clientX / window.innerWidth) * 2 - 1;
		const ny = -((event.clientY / window.innerHeight) * 2 - 1);

		if (this.state === PolygonToolState.INACTIVE) {
			this.startPolygon(nx, ny);
		}

		this.addPointToPolygon(nx, ny);
	}

	private pointerMoveListener(event: PointerEvent) {
		if (this.state !== PolygonToolState.ACTIVE || this.preview) {
			return;
		}

		const nx = (event.clientX / window.innerWidth) * 2 - 1;
		const ny = -((event.clientY / window.innerHeight) * 2 - 1);

		this.moveLastPolygonPoint(nx, ny);
	}

	private keyDownListener(event: KeyboardEvent) {
		if (event.key === "Shift" && this.state === PolygonToolState.ACTIVE) {
			this.showPreview();
		} else if (
			(event.key === "d" ||
				event.key === "D" ||
				event.key === "Delete" ||
				event.key === "Backspace") &&
			this.state !== PolygonToolState.INACTIVE
		) {
			this.removeLastPoint();
		} else if (
			event.key === "a" ||
			event.key === "A" ||
			event.key === "Enter"
		) {
			if (
				this.state === PolygonToolState.ACTIVE &&
				this.getNumberOfPoints() >= MIN_POINTS
			) {
				this.concludePolygon();
			} else if (this.state === PolygonToolState.SELECTED) {
				this.annotate();
			}
		} else if (
			event.key === "Escape" &&
			this.state !== PolygonToolState.INACTIVE
		) {
			this.abort();
		}
	}

	private keyUpListener(event: KeyboardEvent) {
		if (event.key === "Shift") {
			this.hidePreview();
		}
	}

	private toScreenSpaceMatrix = new Matrix4();
	private boxPoints = new Array(8).fill(0).map(() => new Vector3());
	private boxLines = new Array(12).fill(0).map(() => new Line3());
	private polygonSegments: Line3[] = [];
	private perBoundsSegments: Line3[][] = [];

	/**
	 * Updates the selection for all intersecting pints
	 */
	private calculateIntersection(): number[] {
		// TODO: Possible improvements
		// - Correctly handle the camera near clip
		// - Improve line line intersect performance?

		if (this.selectedPoints.length === 0) {
			return [];
		}

		const camera = this.scene.camera;

		this.toScreenSpaceMatrix
			.copy(this.mesh.matrixWorld)
			.premultiply(camera.matrixWorldInverse)
			.premultiply(camera.projectionMatrix);

		// create scratch points and lines to use for selection
		while (this.polygonSegments.length < this.selectedPoints.length) {
			this.polygonSegments.push(new Line3());
		}
		this.polygonSegments.length = this.selectedPoints.length;

		for (let s = 0, l = this.selectedPoints.length; s < l; s += 3) {
			const line = this.polygonSegments[s];
			const sNext = (s + 3) % l;
			line.start.x = this.selectedPoints[s];
			line.start.y = this.selectedPoints[s + 1];

			line.end.x = this.selectedPoints[sNext];
			line.end.y = this.selectedPoints[sNext + 1];
		}

		const indices: number[] = [];
		this.mesh.geometry.boundsTree!.shapecast({
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
					this.perBoundsSegments[depth - 1] || this.polygonSegments;
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

		return this.scene.getModel().translateBVHIndices(indices);
	}
}
