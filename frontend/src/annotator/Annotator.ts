import { err, ok, type Result } from "neverthrow";
import { type Label } from "~entity/Annotation";
import { type ModelInformation } from "~entity/ModelInformation";
import { type Disposable, type Observer } from "~entity/Types";
import { hasFileExtension } from "~util/FileUtils";
import { type AnnotationFileParserError } from "./anno3d/AnnotationFileParser";
import { GenericAnnotationFileParser } from "./anno3d/GenericAnnotationFileParser";
import { AnnotationFileSerializerUTF8v1 } from "./anno3d/UTF8v1/AnnotationFileSerializerUTF8v1";
import { AnnotationManager } from "./annotation/AnnotationManager";
import { LabelManager } from "./annotation/LabelManager";
import { HybridUndoManager } from "./annotation/undo/HybridUndoManager";
import { type UndoManager } from "./annotation/undo/UndoManager";
import { type FileManager } from "./files/FileManager";
import { OriginPrivateFileSystemManager } from "./files/OriginPrivateFileSystemManager";
import {
	MAX_UTF8_FILE_LENGTH,
	PLY_BINARY_SIZE_WARNING,
	type LoaderError,
} from "./scene/model/loader/Loader";
import { OBJ_FILE_EXTENSIONS } from "./scene/model/loader/obj/NonBlockingOBJLoader";
import { PLY_FILE_EXTENSIONS } from "./scene/model/loader/ply/NonBlockingPLYLoader";
import { type Model } from "./scene/model/Model";
import { type Scene } from "./scene/Scene";
import { type SceneManager } from "./scene/SceneManager";
import { type AnnotationVisualizer } from "./scene/visualizer/AnnotationVisualizer";
import "./three/three-mesh-bvh.config";
import { type ToolManager } from "./tools/ToolManger";

export type SetupError = AnnotationFileParserError | LoaderError;

/**
 * The stages of an setup process \
 * Possible stages:
 * 1. ReadModelFiles,
 * 2. InitializeModel,
 * 3. CheckAnnotationFile,
 * 4. ReadAnnotationData,
 * 5. Finished,
 * 6. Canceled,
 */
export enum SetupStage {
	READ_MODEL_FILES = "readModelFile",
	INITIALIZE_MODEL = "initializeModel",
	CHECK_ANNOTATION_FILE = "checkAnnotationFile",
	READ_ANNOTATION_DATA = "readAnnotationData",
	// LoadAnnotations,
	LOAD_TOOLS = "loadTools",
	FINISHED = "finished",
	ABORTED = "aborted",
}

/**
 * The Progress of an setup stage
 */
export interface SetupProgress {
	stage: SetupStage;
	data?: {
		progress?: number;
		warning?: SetupWarning;
	};
}

export enum SetupWarning {
	LARGE_OBJ_FILE = "largeOBJFile",
	LARGE_PLY_FILE = "largePLYFile",
}

/**
 * Can be passed to the annotator setup method to enable aborting the setup
 */
export class AnnotatorSetupAbortController {
	private _aborted = false;

	public get aborted() {
		return this._aborted;
	}

	public abort() {
		this._aborted = true;
	}
}

/**
 * The Annotator, the anchor point for all manager classes
 */
export abstract class Annotator<T extends Model> implements Disposable {
	public readonly labelManager: LabelManager;
	public readonly fileManager: FileManager;
	/**
	 * Exists only after {@link setup} was called and has finished.
	 */
	public undoManager!: UndoManager;

	/**
	 * Exists only after {@link setup} was called and has finished.
	 */
	public sceneManager!: SceneManager;

	public toolManager!: ToolManager<T>;

	private readonly scene: Scene<T>;
	private annotationVisualizer!: AnnotationVisualizer;
	private annotationManager!: AnnotationManager;

	private readonly modelInformation: ModelInformation;

	private setupActive = false;
	private abortController?: AnnotatorSetupAbortController;

	/**
	 * Constructs a new instance of an annotator
	 *
	 * @param sceneParent the element which to add the rendere's dom element to
	 * @param modelInformation  the model information
	 * @param labels the labels
	 * @param rootId the id of the root directory
	 */
	constructor(
		sceneParent: HTMLDivElement,
		modelInformation: ModelInformation,
		labels: Label[],
		rootId: number
	) {
		this.modelInformation = modelInformation;

		this.labelManager = new LabelManager(labels);

		this.fileManager = this.createFileManager(
			rootId,
			modelInformation,
			this.labelManager
		);

		this.scene = this.createScene(sceneParent);
	}

	/**
	 * Creates a new file Manager
	 *
	 * @param rootId the id of the root directory
	 * @param modelId the model id
	 * @param labelManager a label manager
	 * @returns
	 */
	private createFileManager(
		rootId: number,
		modelId: ModelInformation,
		labelManager: LabelManager
	): FileManager {
		const labels = labelManager.getLabels();
		const parser = new GenericAnnotationFileParser(labels);
		const serializer = new AnnotationFileSerializerUTF8v1(labels);
		return new OriginPrivateFileSystemManager(
			rootId,
			modelId,
			parser,
			serializer
		);
	}

	/**
	 * Creates a new scene
	 *
	 * @param canvas a canvas element
	 */
	protected abstract createScene(sceneParen: HTMLDivElement): Scene<T>;

	/**
	 * Setups the annotator
	 * The setup process is divided into multiple {@link SetupStage}.
	 *
	 * @param abortController the AbortController
	 * @param onProgress a progress Observer
	 * @returns true if the setup completed
	 */
	public async setup(
		abortController: AnnotatorSetupAbortController,
		onProgress?: Observer<SetupProgress>
	): Promise<Result<boolean, SetupError>> {
		if (this.setupActive) {
			return ok(true);
		}

		this.setupActive = true;
		this.abortController = abortController;

		this.scene.setup();

		// STAGE ONE (read model files)
		this.setProgress(SetupStage.READ_MODEL_FILES, onProgress);

		const files = await this.fileManager.readModelFiles();
		this.setFileWarnings(SetupStage.READ_MODEL_FILES, onProgress, files);

		if (this.breakSetup()) return ok(false);

		// STAGE TWO (initialize model)
		this.setProgress(SetupStage.INITIALIZE_MODEL, onProgress, {
			progress: 0,
		});

		const progressObserver = (progress: number) => {
			this.setProgress(SetupStage.INITIALIZE_MODEL, onProgress, {
				progress: progress,
			});
		};

		const res = await this.scene.initializeModel(files, progressObserver);
		if (res.isErr()) {
			return err(res.error);
		}

		if (this.breakSetup()) return ok(false);

		// synchronously initialize instances

		this.annotationVisualizer = this.createAnnotationVisualizer(this.scene);

		this.annotationManager = this.createAnnotationManager(
			this.scene.getModel(),
			this.labelManager
		);
		this.annotationManager.addAnnotationObserver(
			this.annotationVisualizer.visualize.bind(this.annotationVisualizer)
		);

		this.undoManager = this.createUndoManager(this.annotationManager);

		// STAGE THREE (check annotation file)
		this.setProgress(SetupStage.CHECK_ANNOTATION_FILE, onProgress);

		if (await this.fileManager.hasAnnotationFile()) {
			if (this.breakSetup()) return ok(false);

			// STAGE FOUR - OPTIONAL (read annotation data)
			this.setProgress(SetupStage.READ_ANNOTATION_DATA, onProgress);

			const result = await this.fileManager.readAnnotationData();
			if (result.isErr()) {
				return err(result.error);
			}

			const data = result.value;

			if (this.breakSetup()) return ok(false);

			// TODO Make asynchronous and non blocking, maybe add animation in visualizer
			// TODO STAGE FIVE (load annotations)
			// this.setProgress(SetupStage.LoadAnnotations, onProgress);

			this.annotationManager.loadAnnotations(data);

			// TODO if (this.breakSetup()) return;
		}

		this.sceneManager = this.scene.createSceneManager();

		// STAGE FIVE(SIX) (load tools)
		this.setProgress(SetupStage.LOAD_TOOLS, onProgress);

		this.toolManager = this.createToolManager(
			this.annotationManager,
			this.undoManager,
			this.scene
		);

		this.setProgress(SetupStage.FINISHED, onProgress);
		this.setupActive = false;
		return ok(true);
	}

	/**
	 * Sets a the setup stage.
	 *
	 * @param stage the stage
	 * @param onProgress a observer
	 * @param progress the progress of a stage
	 */
	private setProgress(
		stage: SetupStage,
		onProgress: Observer<SetupProgress> | undefined,
		data?: SetupProgress["data"]
	) {
		if (onProgress)
			onProgress({
				stage: stage,
				data: data,
			});
	}

	private setFileWarnings(
		stage: SetupStage,
		onProgress: Observer<SetupProgress> | undefined,
		files: File[]
	) {
		for (const file of files) {
			if (
				hasFileExtension(file, OBJ_FILE_EXTENSIONS) &&
				file.size > MAX_UTF8_FILE_LENGTH
			) {
				this.setProgress(stage, onProgress, {
					warning: SetupWarning.LARGE_OBJ_FILE,
				});
			} else if (
				hasFileExtension(file, PLY_FILE_EXTENSIONS) &&
				file.size > PLY_BINARY_SIZE_WARNING
			) {
				this.setProgress(stage, onProgress, {
					warning: SetupWarning.LARGE_PLY_FILE,
				});
			}
		}
	}

	/**
	 * Stops the setup and sets the setup stage to canceled
	 *
	 * @param onProgress a observer
	 * @returns true if the setup could be stopped
	 */
	private breakSetup(onProgress?: Observer<SetupProgress>): boolean {
		if (!this.abortController!.aborted) {
			return false;
		}

		this.disposeAll();
		this.setProgress(SetupStage.ABORTED, onProgress);
		this.setupActive = false;
		return true;
	}

	/**
	 * Creates an annotation visualizer
	 *
	 * @param scene a scene
	 * @return the annotation visualizer
	 */
	protected abstract createAnnotationVisualizer(
		scene: Scene<T>
	): AnnotationVisualizer;

	/**
	 * Creates a new annotation manager
	 *
	 * @param model a model
	 * @param labelManager a label manager
	 * @returns the annotation manager
	 */
	private createAnnotationManager(
		model: T,
		labelManager: LabelManager
	): AnnotationManager {
		const annotationManager = new AnnotationManager(
			model.getIndexCount(),
			labelManager
		);
		return annotationManager;
	}

	private createUndoManager(
		annotationManager: AnnotationManager
	): UndoManager {
		return new HybridUndoManager(annotationManager);
	}

	public notifyVisualizerChange(): void {
		this.annotationVisualizer.visualizeAll(
			this.annotationManager.getLabeledAnnotations()
		);
	}

	public changeVisualizerOpacity(opacity: number): void {
		this.annotationVisualizer.setOpacity(opacity);
		this.notifyVisualizerChange();
	}

	/**
	 * starts the render loop
	 */
	public start(): void {
		this.scene.startRenderLoop();
	}

	/**
	 * stops the render loop
	 */
	public stop(): void {
		this.scene.stopRenderLoop();
	}

	public dispose() {
		if (this.setupActive) {
			this.abortController!.abort();
		} else {
			this.disposeAll();
		}
	}

	/**
	 * Disposes all managers
	 */
	private disposeAll(): void {
		console.log("dispose all");

		this.scene.dispose();

		if (this.annotationVisualizer) {
			this.annotationVisualizer.dispose();
		}

		if (this.annotationManager) {
			this.annotationManager.dispose();
		}

		if (this.undoManager) {
			this.undoManager.dispose();
		}

		if (this.toolManager) {
			this.toolManager.dispose();
		}
	}

	/**
	 * Writes and saves all current annotation data
	 */
	public async save() {
		const data = this.annotationManager.getAnnotations();
		await this.fileManager.writeAnnotationData(data);
	}

	/**
	 * Creates a tool manager
	 *
	 * @param annotationManager a annotation manager
	 * @param scene a scene
	 * @return the tool manager
	 */
	protected abstract createToolManager(
		annotationManager: AnnotationManager,
		undoManager: UndoManager,
		scene: Scene<T>
	): ToolManager<T>;
}
