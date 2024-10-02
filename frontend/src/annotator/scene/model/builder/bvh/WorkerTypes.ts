import type { BufferGeometry, TypedArray } from "three";
import type { MeshBVHOptions, SerializedBVH } from "three-mesh-bvh";

/**
 * The message the bvh builder worker receives in order to start building the bvh.
 */
export interface BVHBuilderWorkerReceive {
	index: TypedArray | null;
	position: TypedArray;
	groups: BufferGeometry["groups"];
	options: MeshBVHOptions;
}

/**
 * The message the bvh builder worker posts after building has finished.
 */
export interface BVHBuilderWorkerSend {
	error: unknown;
	serialized: SerializedBVH | null;
	position: TypedArray | null;
	progress: number | null;
}
