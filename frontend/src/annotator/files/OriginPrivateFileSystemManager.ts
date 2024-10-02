import { ENV } from "env";
import {
	type AnnotationFileParser,
	type ParserResult,
} from "~annotator/anno3d/AnnotationFileParser";
import { type AnnotationFileSerializer } from "~annotator/anno3d/AnnotationFileSerializer";
import { type ModelInformation } from "~entity/ModelInformation";
import { humanReadableDataSize } from "~util/FileUtils";
import { type NamedStream } from "~util/streams/StreamUtils";
import { type FileManager } from "./FileManager";

const CREATE = { create: true };

const ANNOTATOR_ROOT_PREFIX = "annotator";
const MODEL_DIR_NAME = "model";
const ANNOTATION_FILE_NAME = "annotation.anno3d";

const RESET = ENV.ANNOTATOR_3D_RESET_OPFS;

if (RESET) {
	// eslint-disable-next-line @typescript-eslint/no-floating-promises
	reset();
}

/**
 * The manager who manages the origin private file system of the browser
 */
export class OriginPrivateFileSystemManager implements FileManager {
	private readonly annotationRootName: string;

	private readonly parser: AnnotationFileParser;
	private readonly serializer: AnnotationFileSerializer;

	private root?: FileSystemDirectoryHandle;
	private annotationRoot?: FileSystemDirectoryHandle;
	private modelRoot?: FileSystemDirectoryHandle;
	private readonly modelFileHandles: FileSystemFileHandle[] = [];
	private annotationFileHandle?: FileSystemFileHandle;

	/**
	 * Constructs a new Instance of an OriginPrivateFileSystemManager
	 *
	 * @param rootId the root id
	 * @param model the {@link ModelInformation}
	 * @param parser a parser
	 * @param serializer a serializer
	 */
	constructor(
		rootId: number,
		model: ModelInformation,
		parser: AnnotationFileParser,
		serializer: AnnotationFileSerializer
	) {
		this.parser = parser;
		this.serializer = serializer;
		this.annotationRootName = `${ANNOTATOR_ROOT_PREFIX}-${rootId}-${model.id}`;
	}

	/**
	 * The setup to access the file system
	 */
	private async setup() {
		if (!this.root) {
			this.root = await getRoot();
		}

		if (!this.annotationRoot) {
			this.annotationRoot = await this.root.getDirectoryHandle(
				this.annotationRootName,
				CREATE
			);
		}
	}

	/**
	 * Returns true if the file system contains model files
	 *
	 * @returns true if the file system contains model files
	 */
	public async hasModelFiles(): Promise<boolean> {
		await this.setup();

		if (!this.modelRoot) {
			await this.createModelRoot();
		}

		let foundFiles = false;
		for await (const [, handle] of this.modelRoot!.entries()) {
			if (handle.kind === "file") {
				foundFiles = true;
				this.modelFileHandles.push(handle);
			}
		}
		return foundFiles;
	}

	/**
	 * Creates the root directory for the private file system
	 */
	private async createModelRoot() {
		this.modelRoot = await this.annotationRoot!.getDirectoryHandle(
			MODEL_DIR_NAME,
			CREATE
		);
	}

	/**
	 * Returns true if the manager has an annotation file
	 *
	 * @returns true if the manager has an annotation file
	 */
	public async hasAnnotationFile(): Promise<boolean> {
		await this.setup();
		try {
			this.annotationFileHandle =
				await this.annotationRoot!.getFileHandle(ANNOTATION_FILE_NAME);
		} catch (err) {
			return false;
		}
		return true;
	}

	/**
	 * Reads a Model file
	 *
	 * @returns the file
	 */
	public async readModelFiles(): Promise<File[]> {
		if (this.modelFileHandles.length === 0) {
			throw new Error("Model files are not available.");
		}

		const files: File[] = [];
		for (const fileHandle of this.modelFileHandles) {
			files.push(await fileHandle.getFile());
		}

		return files;
	}

	/**
	 * Writes a model file
	 *
	 * @param fileStreams the file stream
	 * @return a promise
	 */
	public async writeModelFiles(fileStreams: NamedStream[]): Promise<void> {
		if (!this.modelRoot) {
			await this.createModelRoot();
		}

		const handleNames = this.modelFileHandles.reduce<
			Record<string, FileSystemFileHandle>
		>((accumulator, current) => {
			accumulator[current.name] = current;
			return accumulator;
		}, {});

		const promises: Promise<void>[] = [];
		for (const { name, stream } of fileStreams) {
			let handle: FileSystemFileHandle;
			if (handleNames[name]) {
				handle = handleNames[name];
			} else {
				handle = await this.modelRoot!.getFileHandle(name, CREATE);
				this.modelFileHandles.push(handle);
			}

			const writable = await handle.createWritable();
			const promise = stream.pipeTo(writable);
			promises.push(promise);
		}
		await Promise.all(promises);
	}

	/**
	 * Reads an annotation file
	 *
	 * @returns the readable stream
	 */
	public async readAnnotationFile(): Promise<ReadableStream<Uint8Array>> {
		if (!this.annotationFileHandle) {
			throw new Error("Annotation file is not available");
		}
		const file = await this.annotationFileHandle.getFile();
		return file.stream();
	}

	/**
	 * Reads the current annotation data
	 *
	 * @returns a {@link LabeledAnnotationData} array
	 */
	public async readAnnotationData(): ParserResult {
		if (!this.annotationFileHandle) {
			throw new Error("Annotation file is not available");
		}

		const annotationDataStream = await this.readAnnotationFile();
		return await this.parser.parse(annotationDataStream);
	}

	/**
	 * Writes the annotation file
	 *
	 * @param fileStream a ReadableStream
	 * @returns a promise
	 */
	public async writeAnnotationFile(
		fileStream: ReadableStream<Uint8Array>
	): Promise<void> {
		if (!this.annotationFileHandle) {
			this.annotationFileHandle =
				await this.annotationRoot!.getFileHandle(
					ANNOTATION_FILE_NAME,
					CREATE
				);
		}
		const writable = await this.annotationFileHandle.createWritable();
		await fileStream.pipeTo(writable);
	}

	/**
	 * Writes annotation data
	 *
	 * @param data the data array
	 */
	public async writeAnnotationData(data: Uint16Array): Promise<void> {
		const stream = this.serializer.serialize(data);
		await this.writeAnnotationFile(stream);
	}

	/**
	 * Returns the directory tree
	 *
	 * @returns the tree
	 */
	public async getTree(): Promise<string> {
		return getTree();
	}
}

/**
 * Returns the root directory
 *
 * @returns the {@link FileSystemDirectoryHandle}
 */
async function getRoot(): Promise<FileSystemDirectoryHandle> {
	return await navigator.storage.getDirectory();
}

/**
 * Returns the directory tree
 *
 * @returns the tree
 */
async function getTree(): Promise<string> {
	const root = await getRoot();
	const [tree, sizes] = await treeRec(root, "/", []);
	const sum = sizes.reduce((acc, value) => acc + value);
	return tree + `\n\n Total size: ${humanReadableDataSize(sum)}`;
}

/**
 * Builds the directory tree
 *
 * @param dir the directory
 * @param parent the parent
 * @returns the tree
 */
async function treeRec(
	dir: FileSystemDirectoryHandle,
	parent: string,
	sizes: number[]
): Promise<[string, number[]]> {
	const strings: string[] = [];

	for await (const entry of dir.values()) {
		if (entry.kind !== "file") {
			continue;
		}

		const file = await entry.getFile();
		sizes.push(file.size);
		const fileString = `${parent}${file.name} (${humanReadableDataSize(
			file.size
		)})`;
		strings.push(fileString);
	}

	for await (const entry of dir.values()) {
		if (entry.kind !== "directory") {
			continue;
		}
		const [dirString] = await treeRec(
			entry,
			parent + entry.name + "/",
			sizes
		);
		strings.push(dirString);
	}

	return [strings.join("\n"), sizes];
}

/**
 * Resets the private file system
 */
async function reset() {
	// TODO Fix group/await problem

	const root = await getRoot();
	console.group("Resetting origin private file system...");

	console.groupCollapsed("Before state");
	const tree = await getTree();
	console.log(tree ? tree : "no entries");
	console.groupEnd();

	for await (const entry of root.values()) {
		if (entry.kind === "directory") {
			console.log(`deleting directory '${entry.name}'`);
		} else if (entry.kind === "file") {
			console.log(`deleting file '${entry.name}'`);
		}
		await root.removeEntry(entry.name, { recursive: true });
	}
	console.groupEnd();
}
