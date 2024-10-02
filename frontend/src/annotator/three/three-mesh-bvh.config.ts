import { BufferGeometry, Mesh as ThreeMesh } from "three";
import {
	acceleratedRaycast,
	computeBoundsTree,
	disposeBoundsTree,
} from "three-mesh-bvh";

ThreeMesh.prototype.raycast = acceleratedRaycast;
BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
