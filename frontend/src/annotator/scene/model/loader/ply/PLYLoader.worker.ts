import { PLYLoader as ThreePLYLoader } from "three/examples/jsm/loaders/PLYLoader";
import { createTimeoutProxy } from "~util/Timeout";
import { findArrayBuffers } from "~util/Util";
import { type LoaderWorkerReceive, type LoaderWorkerSend } from "../Loader";

onmessage = async function ({ data }: MessageEvent<LoaderWorkerReceive>) {
	const { modelFile, options } = data;
	const modelURL = URL.createObjectURL(modelFile);
	try {
		const loader = new ThreePLYLoader();

		const onProgress = options.hasProgressObserver
			? // don't call postMessage on every progress update
			  createTimeoutProxy((progress: ProgressEvent) => {
					postMessage<LoaderWorkerSend>({
						progress: { ...progress },
					});
			  })
			: undefined;

		let geometry = await loader.loadAsync(modelURL, onProgress);
		if (geometry.index !== null) {
			geometry = geometry.toNonIndexed();
		}

		// compute normals (used by phong materials)
		geometry.computeVertexNormals();

		console.log("ply geometry: ", geometry);

		postMessage<LoaderWorkerSend>(
			{
				geometryClone: geometry,
			},
			{ transfer: findArrayBuffers(geometry.attributes) }
		);
	} catch (error) {
		postMessage<LoaderWorkerSend>({ error });
	} finally {
		URL.revokeObjectURL(modelURL);
	}
};
