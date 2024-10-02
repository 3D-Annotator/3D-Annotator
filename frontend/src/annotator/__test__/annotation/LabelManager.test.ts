import { vi } from "vitest";
import { LabelManager } from "~annotator/annotation/LabelManager";
import { NEUTRAL_LABEL, type Label } from "~entity/Annotation";
import { createLabel, createLabels } from "~entity/__test__/Annotation.test";

describe("LabelManager", () => {
	let labels: Label[];
	let labelManager: LabelManager;

	beforeEach(() => {
		labels = createLabels(5);
		labelManager = new LabelManager(labels);
	});

	test("constructor: empty labels array", () => {
		expect(() => {
			new LabelManager([]);
		}).toThrow("empty");
	});

	test("getLabels()", () => {
		expect(labelManager!.getLabels()).toEqual(labels);
	});

	test("getLabels() value is new array", () => {
		const returnedLabels = labelManager.getLabels();
		returnedLabels.push(createLabel());
		expect(labelManager.getLabels()).toEqual(labels);
	});

	test("selectLabel()", () => {
		expect(labelManager.getActiveLabel()).toBe(labels[0]);

		labelManager.selectLabel(labels[1]);
		expect(labelManager.getActiveLabel()).toBe(labels[1]);

		labelManager.selectLabel(labels[0]);
		expect(labelManager.getActiveLabel()).toBe(labels[0]);
	});

	test("selectLabel() with illegal label", () => {
		expect(() => {
			labelManager.selectLabel(createLabel(5, 5));
		}).toThrow("label");

		expect(() => {
			labelManager.selectLabel(createLabel(0, 0));
		}).toThrow("label");

		labelManager.selectLabel(labels[0]);
		expect(labelManager.getActiveLabel()).toBe(labels[0]);
	});

	test("selectEraser()", () => {
		expect(labelManager.getActiveLabel()).toBe(labels[0]);

		labelManager.selectEraser();
		expect(labelManager.getActiveLabel()).toBe(NEUTRAL_LABEL);

		labelManager.selectLabel(labels[0]);
		expect(labelManager.getActiveLabel()).toBe(labels[0]);
	});

	test("isEraserSelected()", () => {
		expect(labelManager.isEraserSelected()).toBe(false);
		labelManager.selectEraser();
		expect(labelManager.isEraserSelected()).toBe(true);
		labelManager.selectLabel(labels[0]);
		expect(labelManager.isEraserSelected()).toBe(false);
	});

	test("updateLabels() empty labels", () => {
		expect(() => {
			labelManager.updateLabels([]);
		}).toThrow("empty");
	});

	test("updateLabels()", () => {
		const newLabels = createLabels(3, 5);
		labelManager.updateLabels(newLabels);
		expect(labelManager.getLabels()).toEqual(newLabels);
		expect(labelManager.getActiveLabel()).toEqual(newLabels[0]);
	});

	test("updateLabels() with selected label", () => {
		const newLabels = createLabels(3, 5);
		labelManager.updateLabels(newLabels, newLabels[1]);
		expect(labelManager.getLabels()).toEqual(newLabels);
		expect(labelManager.getActiveLabel()).toEqual(newLabels[1]);
	});

	test("updateLabels() illegal selected label", () => {
		const newLabels = createLabels(3, 5);
		expect(() => {
			labelManager.updateLabels(newLabels, createLabel(0));
		}).toThrow("selectedLabel");
	});

	test("updateLabels() selected label stays selected", () => {
		expect(labelManager.getActiveLabel()).toEqual(labels[0]);
		const newLabels = [...createLabels(3, 5), labels[0]];
		labelManager.updateLabels(newLabels);
		expect(labelManager.getLabels()).toEqual(newLabels);
		expect(labelManager.getActiveLabel()).toEqual(labels[0]);
	});

	test("addActiveLabelObserver()", () => {
		let observedLabel: Label;

		const observer = vi.fn((data: Label) => {
			observedLabel = data;
		});

		labelManager.addActiveLabelObserver(observer);
		expect(observer.mock.calls.length).toBe(1);
		expect(observedLabel!).toEqual(labels[0]);

		labelManager.selectLabel(labels[1]);
		expect(observer.mock.calls.length).toBe(2);
		expect(observedLabel!).toEqual(labels[1]);

		labelManager.selectLabel(labels[2]);
		labelManager.selectLabel(labels[3]);
		expect(observer.mock.calls.length).toBe(4);
		expect(observedLabel!).toEqual(labels[3]);

		labelManager.selectEraser();
		expect(observer.mock.calls.length).toBe(5);
		expect(observedLabel!).toEqual(NEUTRAL_LABEL);
	});

	test("addActiveLabelObserver() unsubscribe", () => {
		const observer = vi.fn();

		const unsubscribe1 = labelManager.addActiveLabelObserver(observer);
		expect(observer.mock.calls.length).toBe(1);

		labelManager.selectLabel(labels[1]);
		expect(observer.mock.calls.length).toBe(2);

		unsubscribe1();

		labelManager.selectLabel(labels[2]);
		labelManager.selectLabel(labels[3]);
		expect(observer.mock.calls.length).toBe(2);

		observer.mockClear();
		const unsubscribe2 = labelManager.addActiveLabelObserver(observer);
		expect(observer.mock.calls.length).toBe(1);

		labelManager.selectEraser();
		expect(observer.mock.calls.length).toBe(2);

		unsubscribe2();

		labelManager.selectLabel(labels[0]);
		labelManager.selectEraser();
		labelManager.selectLabel(labels[1]);
		expect(observer.mock.calls.length).toBe(2);
	});

	test("addLabelsObserver()", () => {
		let observedLabels: Label[];

		const observer = vi.fn((labels: Label[]) => {
			observedLabels = labels;
		});

		labelManager.addLabelsObserver(observer);
		expect(observer.mock.calls.length).toBe(1);
		expect(observedLabels!).toEqual(labels);

		const newLabels = createLabels(3, 5);
		labelManager.updateLabels(newLabels);

		expect(observer.mock.calls.length).toBe(2);
		expect(observedLabels!).toEqual(newLabels);
	});

	test("addLabelsObserver() unsubscribe", () => {
		const observer = vi.fn();

		const unsubscribe = labelManager.addLabelsObserver(observer);
		expect(observer.mock.calls.length).toBe(1);

		labelManager.updateLabels(createLabels(3, 5));

		expect(observer.mock.calls.length).toBe(2);

		unsubscribe();

		labelManager.updateLabels(createLabels(3, 8));
		expect(observer.mock.calls.length).toBe(2);
	});
});
