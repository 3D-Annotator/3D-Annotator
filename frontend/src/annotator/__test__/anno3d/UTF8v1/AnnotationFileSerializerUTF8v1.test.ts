import { TextDecoder, TextEncoder } from "util";
import { SerializerUTF8v1 } from "~annotator/anno3d/UTF8v1/AnnotationFileSerializerUTF8v1";
import { type Label } from "~entity/Annotation";
import { createLabels } from "~entity/__test__/Annotation.test";
import { type BufferedWriter } from "~util/streams/BufferedWriter";

global.TextEncoder = TextEncoder;

describe("AnnotationFileSerializerUTF8v1", () => {
	let labels: Label[];
	let writer: TestBufferedWriter;
	let serializer: SerializerUTF8v1;

	beforeEach(() => {
		labels = createLabels(3);
		writer = new TestBufferedWriter(5);
		serializer = new SerializerUTF8v1(labels);
	});

	test("serialize simple data", async () => {
		const data = new Uint16Array(10);

		data[0] = 65535;
		data[1] = 1;
		data[2] = 0;
		data[3] = 1;
		data[4] = 0;
		data[5] = 65535;
		data[6] = 0;
		data[7] = 65535;
		data[8] = 0;
		data[9] = 65535;

		await serializer.serializeData(data, writer);

		console.log(writer.res);

		expect(writer.res).toEqual(
			"format UTF8\nversion 1.0\ncount 10\nlabel 0 4\n2\n4\n6\n8\nlabel 1 2\n1\n3\nlabel 2 0\n"
		);
	});

	test("serializer data with split buffer", async () => {
		const data = new Uint16Array(4);

		data[0] = 65535;
		data[1] = 1;
		data[2] = 0;
		data[3] = 1;

		await serializer.serializeData(data, writer);

		console.log(writer.res);

		expect(writer.res).toEqual(
			"format UTF8\nversion 1.0\ncount 4\nlabel 0 1\n2\nlabel 1 2\n1\n3\nlabel 2 0\n"
		);
	});
});

class TestBufferedWriter implements BufferedWriter {
	public res = "";

	private decoder = new TextDecoder();
	private maxBufferSize: number;
	private currentBufferSize = 1;

	constructor(bufferSize: number) {
		this.maxBufferSize = bufferSize;
	}

	write(data: Uint8Array): Promise<void> {
		this.res += this.decoder.decode(data);

		this.nextBufferSize();
		return Promise.resolve();
	}

	private nextBufferSize() {
		this.currentBufferSize =
			this.currentBufferSize < this.maxBufferSize
				? this.currentBufferSize++
				: 1;
	}

	writeSync(data: Uint8Array): Promise<void> | null {
		this.res += this.decoder.decode(data);

		if (this.currentBufferSize < this.maxBufferSize) {
			this.currentBufferSize++;
			return null;
		}

		this.currentBufferSize = 1;
		return Promise.resolve();
	}

	close(): Promise<void> {
		return Promise.resolve();
	}
}
