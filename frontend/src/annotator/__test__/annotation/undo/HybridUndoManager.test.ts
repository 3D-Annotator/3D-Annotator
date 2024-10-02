import { vi } from "vitest";
import { AnnotationManager } from "~annotator/annotation/AnnotationManager";
import { LabelManager } from "~annotator/annotation/LabelManager";
import { HybridUndoManager } from "~annotator/annotation/undo/HybridUndoManager";
import { type UndoRedoCount } from "~annotator/annotation/undo/UndoManager";
import { NEUTRAL_LABEL, type Label } from "~entity/Annotation";
import { createLabel } from "~entity/__test__/Annotation.test";

describe("HybridUndoManager", () => {
	let label1: Label;
	let label2: Label;
	let labelManager: LabelManager;
	let annotationManager: AnnotationManager;
	let hybridUndoManager: HybridUndoManager;

	beforeEach(() => {
		label1 = createLabel(0, 0);
		label2 = createLabel(0, 1);
		labelManager = new LabelManager([label1, label2]);
		annotationManager = new AnnotationManager(10, labelManager);
		hybridUndoManager = new HybridUndoManager(annotationManager);
	});

	test("reset()", () => {
		hybridUndoManager.startGroup();
		annotationManager!.annotate([0, 2, 4]);
		hybridUndoManager.endGroup();
		hybridUndoManager.reset(true);
		hybridUndoManager.undo();

		const annotations = annotationManager!.getAnnotations();
		expect(annotations[0]).toBe(label1!.annotationClass);
		expect(annotations[2]).toBe(label1!.annotationClass);
		expect(annotations[4]).toBe(label1!.annotationClass);
	});

	test("hasUndo()", () => {
		hybridUndoManager.startGroup();
		annotationManager!.annotate([0, 2, 4]);
		hybridUndoManager.endGroup();
		const res = hybridUndoManager.hasUndo();

		expect(res).toBeTruthy();
	});

	test("hasRedo()", () => {
		hybridUndoManager.startGroup();
		annotationManager!.annotate([0, 2, 4]);
		hybridUndoManager.endGroup();
		hybridUndoManager.undo();
		const res = hybridUndoManager.hasRedo();
		expect(res).toBeTruthy();
	});

	test("dispose()", () => {
		hybridUndoManager.dispose();
		hybridUndoManager.startGroup();
		annotationManager.annotate([0, 2]);
		hybridUndoManager.endGroup();
		hybridUndoManager.undo();
		const annotations = annotationManager.getAnnotations();

		expect(annotations[0]).toBe(label1!.annotationClass);
		expect(annotations[2]).toBe(label1!.annotationClass);
	});

	test("set/get MaxUndoStatic()", () => {
		hybridUndoManager.setMaxUndoStatic(2);
		const max = hybridUndoManager.getMaxUndoStatic();
		expect(max).toBe(2);
	});

	test("set/get MaxUndoMemory()", () => {
		hybridUndoManager.setMaxUndoMemory(2);
		const max = hybridUndoManager.getMaxUndoMemory();
		expect(max).toBe(2);
	});

	test("setUseStaticUndoLimit()", () => {
		hybridUndoManager.setUseStaticUndoLimit(true);
		hybridUndoManager.setMaxUndoStatic(1);

		hybridUndoManager.startGroup();
		annotationManager!.annotate([0, 2]);
		hybridUndoManager.endGroup();
		hybridUndoManager.startGroup();
		annotationManager!.annotate([0, 3]);
		hybridUndoManager.endGroup();
		hybridUndoManager.undo();
		hybridUndoManager.undo();

		const annotations = annotationManager!.getAnnotations();
		expect(annotations[0]).toBe(label1!.annotationClass);
		expect(annotations[2]).toBe(label1!.annotationClass);
	});

	test("setMaxUndoStatic() negative value", () => {
		const res = () => {
			hybridUndoManager.setMaxUndoStatic(-1);
		};
		expect(res).toThrowError();
	});

	test("setMaxUndoMemory() negative value", () => {
		const res = () => {
			hybridUndoManager.setMaxUndoMemory(-1);
		};
		expect(res).toThrowError();
	});

	test("addUndoRedoCountObserver()", () => {
		let observedData: UndoRedoCount;

		const observer = vi.fn((count: UndoRedoCount) => {
			observedData = count;
		});

		hybridUndoManager.addUndoRedoCountObserver(observer);
		hybridUndoManager.startGroup();
		annotationManager!.annotate([0, 2, 4]);
		hybridUndoManager.endGroup();

		expect(observer.mock.calls.length).toBe(1);
		expect(observedData!).toEqual({ undos: 1, redos: 0 });
	});

	test("unsubscribe addUndoRedoCountObserver()", () => {
		let observedData: UndoRedoCount;

		const observer = vi.fn((count: UndoRedoCount) => {
			observedData = count;
		});

		const unsubscribe =
			hybridUndoManager.addUndoRedoCountObserver(observer);
		hybridUndoManager.startGroup();
		annotationManager!.annotate([0, 2, 4]);
		hybridUndoManager.endGroup();
		unsubscribe();
		hybridUndoManager.redo();

		expect(observer.mock.calls.length).toBe(1);
		expect(observedData!).toEqual({ undos: 1, redos: 0 });
	});

	test("deactivate()", () => {
		hybridUndoManager.deactivate();
		hybridUndoManager.startGroup();
		annotationManager!.annotate([0, 2]);
		hybridUndoManager.endGroup();
		hybridUndoManager.undo();

		const annotations = annotationManager!.getAnnotations();
		expect(annotations[0]).toBe(label1!.annotationClass);
		expect(annotations[2]).toBe(label1!.annotationClass);
	});

	test("activate()", () => {
		hybridUndoManager.deactivate();
		hybridUndoManager.startGroup();
		annotationManager!.annotate([0, 2]);
		hybridUndoManager.endGroup();
		hybridUndoManager.undo();

		let annotations = annotationManager!.getAnnotations();
		expect(annotations[0]).toBe(label1!.annotationClass);
		expect(annotations[2]).toBe(label1!.annotationClass);

		hybridUndoManager.activate();
		hybridUndoManager.startGroup();
		annotationManager!.annotate([3, 4]);
		hybridUndoManager.endGroup();
		hybridUndoManager.undo();

		annotations = annotationManager!.getAnnotations();
		expect(annotations[3]).toBe(NEUTRAL_LABEL.annotationClass);
		expect(annotations[4]).toBe(NEUTRAL_LABEL.annotationClass);
	});

	test("undo()", () => {
		hybridUndoManager.startGroup();
		annotationManager!.annotate([0, 2, 4]);
		hybridUndoManager.endGroup();
		hybridUndoManager.undo();

		const annotations = annotationManager!.getAnnotations();
		expect(annotations[0]).toBe(NEUTRAL_LABEL.annotationClass);
		expect(annotations[2]).toBe(NEUTRAL_LABEL.annotationClass);
		expect(annotations[4]).toBe(NEUTRAL_LABEL.annotationClass);
	});

	test("multiple undo()", () => {
		hybridUndoManager.startGroup();
		annotationManager!.annotate([0, 2]);
		hybridUndoManager.endGroup();
		hybridUndoManager.startGroup();
		labelManager.selectLabel(label2);
		annotationManager!.annotate([2, 6]);
		hybridUndoManager.endGroup();

		let annotations = annotationManager!.getAnnotations();
		expect(annotations[0]).toBe(label1!.annotationClass);
		expect(annotations[2]).toBe(label2!.annotationClass);
		expect(annotations[4]).toBe(NEUTRAL_LABEL.annotationClass);
		expect(annotations[6]).toBe(label2!.annotationClass);

		hybridUndoManager.undo();

		annotations = annotationManager!.getAnnotations();
		expect(annotations[0]).toBe(label1!.annotationClass);
		expect(annotations[2]).toBe(label1!.annotationClass);
		expect(annotations[4]).toBe(NEUTRAL_LABEL.annotationClass);
		expect(annotations[6]).toBe(NEUTRAL_LABEL.annotationClass);

		hybridUndoManager.undo();

		annotations = annotationManager!.getAnnotations();
		expect(annotations[0]).toBe(NEUTRAL_LABEL.annotationClass);
		expect(annotations[2]).toBe(NEUTRAL_LABEL.annotationClass);
		expect(annotations[4]).toBe(NEUTRAL_LABEL.annotationClass);
	});

	test("redo()", () => {
		hybridUndoManager.startGroup();
		annotationManager!.annotate([0, 2, 4]);
		hybridUndoManager.endGroup();
		hybridUndoManager.undo();
		hybridUndoManager.redo();

		const annotations = annotationManager!.getAnnotations();
		expect(annotations[0]).toBe(label1!.annotationClass);
		expect(annotations[2]).toBe(label1!.annotationClass);
		expect(annotations[4]).toBe(label1!.annotationClass);
	});

	test("multiple redo()", () => {
		hybridUndoManager.startGroup();
		annotationManager!.annotate([0, 2]);
		hybridUndoManager.endGroup();
		hybridUndoManager.startGroup();
		labelManager.selectLabel(label2);
		annotationManager!.annotate([2, 6]);
		hybridUndoManager.endGroup();
		hybridUndoManager.undo();
		hybridUndoManager.undo();

		let annotations = annotationManager!.getAnnotations();
		expect(annotations[0]).toBe(NEUTRAL_LABEL.annotationClass);
		expect(annotations[2]).toBe(NEUTRAL_LABEL.annotationClass);
		expect(annotations[4]).toBe(NEUTRAL_LABEL.annotationClass);

		hybridUndoManager.redo();

		annotations = annotationManager!.getAnnotations();
		expect(annotations[0]).toBe(label1!.annotationClass);
		expect(annotations[2]).toBe(label1!.annotationClass);
		expect(annotations[4]).toBe(NEUTRAL_LABEL.annotationClass);
		expect(annotations[6]).toBe(NEUTRAL_LABEL.annotationClass);

		hybridUndoManager.redo();

		annotations = annotationManager!.getAnnotations();
		expect(annotations[0]).toBe(label1!.annotationClass);
		expect(annotations[2]).toBe(label2!.annotationClass);
		expect(annotations[4]).toBe(NEUTRAL_LABEL.annotationClass);
		expect(annotations[6]).toBe(label2!.annotationClass);
	});

	test("nothing to undo()", () => {
		hybridUndoManager.startGroup();
		hybridUndoManager.endGroup();
		hybridUndoManager.undo();
	});
});
