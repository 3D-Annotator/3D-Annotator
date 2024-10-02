import {
	Box3,
	BufferAttribute,
	type BufferGeometry,
	type TypedArray,
} from "three";
import { MeshBVH, type MeshBVHOptions } from "three-mesh-bvh";
import type {
	BVHBuilderWorkerReceive,
	BVHBuilderWorkerSend,
} from "./WorkerTypes";

export class NonBlockingBVHBuilder {
	private running: boolean;
	private worker: Worker | null;

	constructor() {
		this.running = false;
		this.worker = new Worker(
			new URL("./BVHBuilder.worker.ts", import.meta.url),
			{ type: "module" }
		);
		this.worker.onerror = (error) => {
			throw new Error(
				`NonBlockingBVHBuilder: Could not create Web Worker: "${error.message}"`
			);
		};
	}

	public async build(
		geometry: BufferGeometry,
		options: MeshBVHOptions = {}
	): Promise<MeshBVH> {
		if (this.running) {
			throw new Error("NonBlockingBVHBuilder: Already running job.");
		}

		if (this.worker === null) {
			throw new Error("NonBlockingBVHBuilder: Worker has been disposed.");
		}

		const worker = this.worker;
		this.running = true;

		return new Promise((resolve, reject) => {
			worker.onerror = (e) => {
				reject(new Error(`NonBlockingBVHBuilder: ${e.message}`));
				this.running = false;
			};

			worker.onmessage = ({
				data,
			}: MessageEvent<BVHBuilderWorkerSend>) => {
				this.running = false;

				const { error, serialized, position, progress } = data;

				if (error) {
					reject(error);
					worker.onmessage = null;
				} else if (serialized && position) {
					const bvh = MeshBVH.deserialize(serialized, geometry, {
						setIndex: false,
					});
					const boundsOptions = Object.assign(
						{
							setBoundingBox: true,
						},
						options
					);

					// we need to replace the arrays because they're neutered entirely by the
					// webworker transfer.
					const positionAttribute = geometry.attributes
						.position as BufferAttribute;
					positionAttribute.array = position;

					// TODO: Remove once types in three-mesh-bvh are fixed
					const index = serialized.index as TypedArray;
					if (geometry.index) {
						geometry.index.array = index;
					} else {
						const newIndex = new BufferAttribute(index, 1, false);
						geometry.setIndex(newIndex);
					}

					if (boundsOptions.setBoundingBox) {
						geometry.boundingBox = bvh.getBoundingBox(new Box3());
					}

					resolve(bvh);
					worker.onmessage = null;
				} else if (options.onProgress && progress) {
					options.onProgress(progress);
				}
			};

			const index = geometry.index ? geometry.index.array : null;
			const position = geometry.attributes.position.array;

			const transferable = [position];
			if (index) {
				transferable.push(index);
			}

			worker.postMessage<BVHBuilderWorkerReceive>(
				{
					index,
					position,
					groups: [...geometry.groups],
					options: options,
				},
				transferable
					.map((arr) => arr.buffer)
					.filter(
						(v) =>
							typeof SharedArrayBuffer === "undefined" ||
							!(v instanceof SharedArrayBuffer)
					)
			);
		});
	}

	public dispose() {
		if (!this.worker) return;
		this.worker.terminate();
		this.worker = null;
	}
}
