export const DEFAULT_ALPHA_VALUE = 0;

/**
 * Represents a 24-bit RGB color.
 */
export class Color {
	/**
	 * Representation as a 32-bit RGBA color. Default alpha value is 0.
	 * Changing the values of this array leads to undefined behavior!
	 */
	public readonly intValues: Uint8Array;
	/**
	 * Internal representation as a 32-bit float RGBA color. Default alpha value is 0.
	 * Each value is represented as a value between 0.0 and 1.0;
	 * Changing the values of this array leads to undefined behavior!
	 */
	public readonly floatValues: Float32Array;

	constructor(red: number, green: number, blue: number) {
		this.checkColorValue(red);
		this.checkColorValue(green);
		this.checkColorValue(blue);
		this.intValues = new Uint8Array([
			red,
			green,
			blue,
			DEFAULT_ALPHA_VALUE,
		]);
		this.floatValues = new Float32Array([
			red / 255.0,
			green / 255.0,
			blue / 255.0,
			DEFAULT_ALPHA_VALUE / 255.0,
		]);
	}

	public get red(): number {
		return this.intValues[0];
	}

	public get redFloat(): number {
		return this.floatValues[0];
	}

	public get green(): number {
		return this.intValues[1];
	}

	public get greenFloat(): number {
		return this.floatValues[1];
	}

	public get blue(): number {
		return this.intValues[2];
	}

	public get blueFloat(): number {
		return this.floatValues[2];
	}

	/**
	 * Creates a new Color instance from a number.
	 * The number needs to be encoded as specified by {@link asNumber}.
	 *
	 * @param number a number encoded color
	 * @returns a new instance of Color
	 */
	public static fromNumber(number: number): Color {
		const red = (number & 0xff0000) >> 16;
		const green = (number & 0x00ff00) >> 8;
		const blue = number & 0x0000ff;
		return new Color(red, green, blue);
	}

	public static fromHTMLCode(code: string): Color {
		code = code.substring(1);
		const bigint = parseInt(code, 16);
		const r = (bigint >> 16) & 255;
		const g = (bigint >> 8) & 255;
		const b = bigint & 255;
		return new Color(r, g, b);
	}

	/**
	 * Encodes this color in a number and returns the result.
	 *
	 * Encoding (most significant to least significant bit):
	 * 8 bit red | 8 bit green | 8 bit blue
	 *
	 * @returns the number encoded color
	 */
	public asNumber(): number {
		return (
			(this.intValues[0] << 16) +
			(this.intValues[1] << 8) +
			this.intValues[2]
		);
	}

	/**
	 * Creates a HTML color code from this number an returns it.
	 *
	 * @returns the HTML color code
	 */
	public asHTMLCode(): string {
		return (
			"#" +
			this.colorValueToHexString(this.intValues[0]) +
			this.colorValueToHexString(this.intValues[1]) +
			this.colorValueToHexString(this.intValues[2])
		);
	}

	private colorValueToHexString(colorValue: number): string {
		const s = colorValue.toString(16);
		return s.length === 1 ? "0" + s : s;
	}

	private checkColorValue(value: number) {
		if (value < 0) {
			throw new Error(`Color conversion: ${value} is negative.`);
		}
		if (value > 255) {
			throw new Error(`Color conversion: ${value} is greater than 255.`);
		}
	}
}

/**
 * array of a selection of a models indices
 */
export type AnnotationData = number[];

/**
 * Maps a single label to an array of a selection of a models indices
 */
export interface LabeledAnnotationData {
	label: Label;
	data: AnnotationData;
}

/**
 * A label object
 */
export class Label {
	public readonly id: number;
	public readonly annotationClass: number;
	public readonly name: string;
	public readonly color: Color;
	public annotationVisible = true;
	public locked = false;

	constructor(
		id: number,
		annotationClass: number,
		name: string,
		color: Color
	) {
		this.id = id;

		if (annotationClass < 0 || annotationClass > NEUTRAL_ANNOTATION_CLASS) {
			throw new Error("'annotationClass' is out of bounds.");
		}
		this.annotationClass = annotationClass;

		this.name = name;
		this.color = color;
	}

	public isNeutral(): boolean {
		return this.annotationClass === NEUTRAL_ANNOTATION_CLASS;
	}
}

const UINT16_MAX = Math.pow(2, 16) - 1;
const RESERVED_ANNOTATION_CLASS_COUNT = 10;

export const MIN_ANNOTATION_CLASS = 0;
export const MAX_ANNOTATION_CLASS =
	UINT16_MAX - RESERVED_ANNOTATION_CLASS_COUNT;

/**
 * The neutral annotation class.
 * set to the max int in Uint16 (2^16 - 1)
 */
const NEUTRAL_ANNOTATION_CLASS = UINT16_MAX;

/**
 * The neutral label
 */
export const NEUTRAL_LABEL = new Label(
	0,
	NEUTRAL_ANNOTATION_CLASS,
	"neutralLabel",
	new Color(0, 0, 0)
);
