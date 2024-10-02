import { BufferAttribute, BufferGeometry } from "three";
import { MeshBVH } from "three-mesh-bvh";
import type {
	BVHBuilderWorkerReceive,
	BVHBuilderWorkerSend,
} from "./WorkerTypes";

onmessage = function ({ data }: MessageEvent<BVHBuilderWorkerReceive>) {
	let prevTime = performance.now();

	function onProgressCallback(progress: number) {
		const currTime = performance.now();
		if (currTime - prevTime >= 10 || progress === 1.0) {
			postMessage<BVHBuilderWorkerSend>({
				error: null,
				serialized: null,
				position: null,
				progress,
			});
			prevTime = currTime;
		}
	}

	const { index, position, groups, options } = data;
	try {
		const geometry = new BufferGeometry();
		geometry.setAttribute(
			"position",
			new BufferAttribute(position, 3, false)
		);
		if (index) {
			geometry.setIndex(new BufferAttribute(index, 1, false));
		}

		if (options.onProgress) {
			options.onProgress = onProgressCallback;
		}

		if (groups) {
			for (const group of groups) {
				geometry.addGroup(
					group.start,
					group.count,
					group.materialIndex
				);
			}
		}

		const bvh = new MeshBVH(geometry, options);
		const serialized = MeshBVH.serialize(bvh, { cloneBuffers: false });
		postMessage<BVHBuilderWorkerSend>(
			{
				error: null,
				serialized,
				position,
				progress: 1,
			},
			{
				transfer: [
					serialized.index.buffer,
					position.buffer,
					...serialized.roots,
				].filter(
					(v) =>
						typeof SharedArrayBuffer === "undefined" ||
						!(v instanceof SharedArrayBuffer)
				),
			}
		);
	} catch (error) {
		postMessage<BVHBuilderWorkerSend>({
			error,
			serialized: null,
			position: null,
			progress: 1,
		});
	}
};
