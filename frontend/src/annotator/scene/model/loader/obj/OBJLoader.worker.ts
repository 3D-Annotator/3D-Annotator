import { type BufferGeometry, type Group, type Mesh as ThreeMesh } from "three";
import { OBJLoader as ThreeOBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
import { humanReadableDataSize } from "~util/FileUtils";
import { createTimeoutProxy } from "~util/Timeout";
import { findArrayBuffers } from "~util/Util";
import {
	MAX_UTF8_FILE_LENGTH,
	type LoaderWorkerReceive,
	type LoaderWorkerSend,
} from "../Loader";
import { MyOBJLoader } from "./BigFileOBJLoader";

/**
 * The worker theoretically supports files sizes way bigger than {@link MAX_UTF8_FILE_LENGTH}
 * by extracting the file content without loading the whole file into a single string.
 * This unfortunately leads to out of memory errors in many browsers caused by the
 * three.js OBJLoader.
 */
onmessage = async function ({ data }: MessageEvent<LoaderWorkerReceive>) {
	const { modelFile, options } = data;

	let modelURL;

	try {
		let group;
		if (modelFile.size <= MAX_UTF8_FILE_LENGTH) {
			const loader = new ThreeOBJLoader();
			modelURL = URL.createObjectURL(modelFile);
			const onProgress = options.hasProgressObserver
				? // don't call postMessage on every progress update
				  createTimeoutProxy((progress: ProgressEvent) => {
						postMessage<LoaderWorkerSend>({
							progress: { ...progress },
						});
				  })
				: undefined;
			group = await loader.loadAsync(modelURL, onProgress);
		} else {
			const size = humanReadableDataSize(modelFile.size);
			console.warn(
				`OBJLoader: Parsing a big file (${size}) may lead to out of memory errors!`
			);
			const loader = new MyOBJLoader();
			const buffer = await modelFile.arrayBuffer();
			const lines = getLinesOfBigFile(buffer);
			group = loader.parseLines(lines);
		}

		let geometry = mergeGroup(group);
		if (geometry.index !== null) {
			geometry = geometry.toNonIndexed();
		}

		console.log("obj geometry: ", geometry);

		postMessage<LoaderWorkerSend>(
			{
				geometryClone: geometry,
			},
			{ transfer: findArrayBuffers(geometry.attributes) }
		);
	} catch (error) {
		postMessage<LoaderWorkerSend>({ error });
	} finally {
		if (modelURL) {
			URL.revokeObjectURL(modelURL);
		}
	}
};

function getLinesOfBigFile(buffer: ArrayBuffer): string[] {
	const data = new Uint8Array(buffer);
	let lines: string[] = [];
	for (let i = 0; i < data.length; i += MAX_UTF8_FILE_LENGTH) {
		const slice = data.subarray(i, i + MAX_UTF8_FILE_LENGTH);

		const currentLines = getLines(slice);

		const lastLine = lines.at(-1);
		const lastCharacter = lastLine?.charAt(lastLine.length - 1);

		const firstLine = currentLines[0];
		if (lastCharacter === "\\" && firstLine === "") {
			// buffer sliced between "\" and "\n"
			lines.pop();
			currentLines.shift();
			currentLines[0] = removeLastChar(lastLine!) + currentLines[0];
		} else if (lastCharacter === "\r" && firstLine === "") {
			// buffer sliced between "\r" and "\n"
			lines.pop();
			currentLines[0] = removeLastChar(lastLine!);
		} else if (lastLine === "") {
			// buffer sliced between "\n" and next line
			lines.pop();
		} else if (firstLine === "" && lines.length > 0) {
			// buffer sliced between a line and its line ending ("\n")

			lines.pop();
			currentLines[0] = lastLine!;
		} else if (lines.length > 0) {
			// buffer sliced a line
			lines.pop();
			currentLines[0] = `${lastLine}${firstLine}`;
		}

		lines = lines.concat(currentLines);
	}
	return lines;
}

function getLines(data: Uint8Array): string[] {
	let string = new TextDecoder().decode(data);

	if (string.includes("\r\n")) {
		// This is faster than String.split with regex that splits on both
		string = string.replace(/\r\n/g, "\n");
	}

	if (string.includes("\\\n")) {
		// join lines separated by a line continuation character (\)
		string = string.replace(/\\\n/g, "");
	}

	return string.split("\n");
}

function removeLastChar(string: string): string {
	return string.substring(0, string.length - 1);
}

function mergeGroup(group: Group) {
	const meshes = group.children as ThreeMesh[];
	const geometryArray: BufferGeometry[] = [];
	for (const mesh of meshes) {
		geometryArray.push(mesh.geometry);
	}
	return mergeGeometries(geometryArray);
}
