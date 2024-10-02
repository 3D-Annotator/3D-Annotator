export interface NamedStream<
	T extends
		| ReadableStream<Uint8Array>
		| WritableStream<Uint8Array> = ReadableStream<Uint8Array>
> {
	stream: T;
	name: string;
}

export async function readableStreamAsBlob(stream: ReadableStream<Uint8Array>) {
	const reader = stream.getReader();
	const chunks: Uint8Array[] = [];

	while (true) {
		const { value, done } = await reader.read();

		if (done) {
			break;
		}

		chunks.push(value);
	}

	return new Blob(chunks);
}
