import { Color, DEFAULT_ALPHA_VALUE, Label } from "~entity/Annotation";

export function createColor(red = 0, green = 0, blue = 0) {
	return new Color(red, green, blue);
}

export function createLabel(
	id = 0,
	annotationClass = 0,
	name = "",
	color: Color = createColor()
) {
	return new Label(id, annotationClass, name, color);
}

export function createLabels(count: number, start = 0) {
	const labels = [];
	for (let i = start; i < start + count; i++) {
		labels.push(createLabel(i, i));
	}
	return labels;
}

describe("Annotation", () => {
	describe("Color", () => {
		let colors: Color[];

		beforeEach(() => {
			colors = [
				new Color(0, 0, 0),
				new Color(1, 1, 1),
				new Color(2, 127, 253),
				new Color(254, 254, 254),
				new Color(255, 255, 255),
			];
		});

		test("constructor", () => {
			let color = new Color(0, 0, 0);
			expect(color.red).toBe(0);
			expect(color.green).toBe(0);
			expect(color.blue).toBe(0);

			color = new Color(255, 255, 255);
			expect(color.red).toBe(255);
			expect(color.green).toBe(255);
			expect(color.blue).toBe(255);

			color = new Color(1, 128, 255);
			expect(color.red).toBe(1);
			expect(color.green).toBe(128);
			expect(color.blue).toBe(255);
		});

		test("constructor illegal values", () => {
			expect(() => {
				new Color(-1, 0, 0);
			}).toThrow();

			expect(() => {
				new Color(0, -2, 0);
			}).toThrow();

			expect(() => {
				new Color(0, 0, -3);
			}).toThrow();

			expect(() => {
				new Color(256, 0, 0);
			}).toThrow();

			expect(() => {
				new Color(0, 257, 0);
			}).toThrow();

			expect(() => {
				new Color(0, 0, 258);
			}).toThrow();
		});

		test("values", () => {
			expect(colors[0].intValues).toEqual(
				new Uint8Array([0, 0, 0, DEFAULT_ALPHA_VALUE])
			);

			expect(colors[1].intValues).toEqual(
				new Uint8Array([1, 1, 1, DEFAULT_ALPHA_VALUE])
			);

			expect(colors[2].intValues).toEqual(
				new Uint8Array([2, 127, 253, DEFAULT_ALPHA_VALUE])
			);

			expect(colors[3].intValues).toEqual(
				new Uint8Array([254, 254, 254, DEFAULT_ALPHA_VALUE])
			);

			expect(colors[4].intValues).toEqual(
				new Uint8Array([255, 255, 255, DEFAULT_ALPHA_VALUE])
			);
		});

		test("fromNumber()/asNumber()", () => {
			for (const color of colors) {
				expect(Color.fromNumber(color.asNumber())).toEqual(color);
			}
		});

		test("fromHTMLCode()", () => {
			for (const color of colors) {
				expect(color).toEqual(Color.fromHTMLCode(color.asHTMLCode()));
			}
		});

		test("asHTMLCode()", () => {
			expect(colors[0].asHTMLCode()).toBe("#000000");
			expect(colors[1].asHTMLCode()).toBe("#010101");
			expect(colors[2].asHTMLCode()).toBe("#027ffd");
			expect(colors[3].asHTMLCode()).toBe("#fefefe");
			expect(colors[4].asHTMLCode()).toBe("#ffffff");
		});
	});

	describe("Label", () => {
		test("constructor", () => {
			const color = createColor();
			const label = new Label(0, 0, "name", color);
			expect(label.id).toBe(0);
			expect(label.annotationClass).toBe(0);
			expect(label.name).toBe("name");
			expect(label.color).toEqual(color);

			const label2 = new Label(3452, 23452, "test1234", color);
			expect(label2.id).toBe(3452);
			expect(label2.annotationClass).toBe(23452);
			expect(label2.name).toBe("test1234");
		});

		test("constructor with illegal annotationClass", () => {
			const color = createColor();
			expect(() => {
				new Label(0, -1, "", color);
			}).toThrow("out of bounds");

			expect(() => {
				new Label(0, Math.pow(2, 16), "", color);
			}).toThrow("out of bounds");
		});
	});
});
