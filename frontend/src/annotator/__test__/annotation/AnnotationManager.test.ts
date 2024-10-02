import { vi } from "vitest";
import { AnnotationManager } from "~annotator/annotation/AnnotationManager";
import { LabelManager } from "~annotator/annotation/LabelManager";
import {
	NEUTRAL_LABEL,
	type Label,
	type LabeledAnnotationData,
} from "~entity/Annotation";
import { createLabel } from "~entity/__test__/Annotation.test";

describe("AnnotationManager", () => {
	let label1: Label;
	let labelManager: LabelManager;
	let annotationManager: AnnotationManager;

	beforeEach(() => {
		label1 = createLabel(0, 0);
		labelManager = new LabelManager([label1]);
		annotationManager = new AnnotationManager(10, labelManager);
	});

	test("constructor()/getAnnotations() indexSize", () => {
		const indexCount = 5;
		const manager = new AnnotationManager(indexCount, labelManager);

		expect(manager.getAnnotations().length).toBe(indexCount);
	});

	test("annotate() one index", () => {
		annotationManager!.annotate([0]);

		const annotations = annotationManager!.getAnnotations();
		expect(annotations[0]).toBe(label1!.annotationClass);

		for (let i = 1; i < annotations.length; i++) {
			expect(annotations[i]).toBe(NEUTRAL_LABEL.annotationClass);
		}
	});

	test("annotate() multiple indices", () => {
		annotationManager!.annotate([0, 2, 4]);

		const annotations = annotationManager!.getAnnotations();
		expect(annotations[0]).toBe(label1!.annotationClass);

		expect(annotations[1]).toBe(NEUTRAL_LABEL.annotationClass);

		expect(annotations[2]).toBe(label1!.annotationClass);

		expect(annotations[3]).toBe(NEUTRAL_LABEL.annotationClass);

		expect(annotations[4]).toBe(label1!.annotationClass);
	});

	test("loadAnnotations()", () => {
		const label2 = createLabel(1, 1);
		const label3 = createLabel(2, 2);

		annotationManager.loadAnnotations([
			{ label: NEUTRAL_LABEL, data: [0] },
			{ label: label1, data: [1] },
			{ label: label2, data: [2] },
			{ label: label3, data: [3] },
		]);

		const annotations = annotationManager.getAnnotations();

		expect(annotations[0]).toBe(NEUTRAL_LABEL.annotationClass);
		expect(annotations[1]).toBe(label1.annotationClass);
		expect(annotations[2]).toBe(label2.annotationClass);
		expect(annotations[3]).toBe(label3.annotationClass);
		expect(annotations[4]).toBe(NEUTRAL_LABEL.annotationClass);
	});

	test("addAnnotationObserver()", () => {
		const data = [0, 2, 4];
		let observedData: LabeledAnnotationData;

		const observer = vi.fn((data: LabeledAnnotationData) => {
			observedData = data;
		});

		annotationManager.addAnnotationObserver(observer);
		annotationManager.annotate(data);

		expect(observer.mock.calls.length).toBe(1);
		expect(observedData!).toEqual({ label: label1, data: data });
	});

	test("unsubscribe observer", () => {
		const observer = vi.fn();

		const unsubscribe = annotationManager.addAnnotationObserver(observer);
		unsubscribe();
		annotationManager.annotate([0]);
		expect(observer.mock.calls.length).toBe(0);
	});

	test("dispose() clears data", () => {
		annotationManager.annotate([0, 1, 3, 4]);
		annotationManager.dispose();
		const data = annotationManager.getAnnotations();
		for (const index of data) {
			expect(index).toEqual(NEUTRAL_LABEL.annotationClass);
		}
	});

	test("dispose() clears observers", () => {
		const observer = vi.fn();
		annotationManager.addAnnotationObserver(observer);
		annotationManager.dispose();

		annotationManager.annotate([0]);
		expect(observer.mock.calls.length).toBe(0);
	});
});
