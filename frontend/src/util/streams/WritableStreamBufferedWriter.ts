import { type BufferedWriter } from "./BufferedWriter";

export const BUFFER_SIZE_1K = 1024;
export const BUFFER_SIZE_2K = 2048;
export const BUFFER_SIZE_4K = 4096;
export const BUFFER_SIZE_8K = 8192;
export const BUFFER_SIZE_16K = 16384;
export const BUFFER_SIZE_32K = 32768;
export const BUFFER_SIZE_64K = 65536;
export const BUFFER_SIZE_128K = 131072;

/**
 * A buffered writer for writable streams.
 */
export class WritableStreamBufferedWriter implements BufferedWriter {
	private readonly bufferSize: number;
	private readonly writer: WritableStreamDefaultWriter;

	private buffer: Uint8Array;
	private index: number;

	/**
	 * Constructs a new `WritableStreamBufferedWriter`.
	 *
	 * @param writableStream the `WritableStream` this writer should write to
	 * @param bufferSize the size of the buffer in bytes (default: {@link BUFFER_SIZE_16K})
	 */
	constructor(
		writableStream: WritableStream,
		bufferSize: number = BUFFER_SIZE_16K
	) {
		this.bufferSize = bufferSize;
		this.buffer = new Uint8Array(bufferSize);
		this.index = 0;

		this.writer = writableStream.getWriter();
	}

	/**
	 * Writes the given binary data to the buffer. If full, the buffer will be
	 * flushed to the underlying `WritableStream`.
	 *
	 * If you need to call {@link write()} a lot, e.g. in a loop, consider using
	 * {@link writeSync()} instead for a significant performance improvement.
	 *
	 * @param data the data
	 * @returns a Promise that resolves when the writing operation completed
	 */
	public async write(data: Uint8Array): Promise<void> {
		const promise = this.writeSync(data);
		if (promise) {
			return promise;
		}
	}

	/**
	 * A synchronous version of {@link write()}.
	 *
	 * This method returns `null` if `data` was only written to the buffer and
	 * a `Promise` if the buffer needed to be flushed subsequently. This
	 * `Promise` resolves when the writing operation to the underlying
	 * `WritableStream` completed successfully.
	 *
	 * To use {@link writeSync()} in an efficient way in `async` methods you
	 * may adhere to the following idiom:
	 *
	 * @example
	 * const promise = writer.writeSync(data);
	 * if (promise) {
	 * 	await promise;
	 * }
	 *
	 * @param data the data
	 * @returns `null` or a Promise that resolves when flushing the buffer to
	 *          the Stream completed
	 */
	public writeSync(data: Uint8Array): Promise<void> | null {
		if (this.index + data.length >= this.buffer.length) {
			return this.writeAndFlush(data);
		}

		this.writeToBuffer(data);
		return null;
	}

	/**
	 * Closes the underlying `WritableStream`. All subsequent calls to
	 * {@link write()} and {@link writeSync()} will throw an error.
	 *
	 * @returns a `Promise` that resolves when the closing operation completed
	 *          successfully
	 */
	public async close(): Promise<void> {
		this.buffer = this.buffer.subarray(0, this.index);
		await this.flush();
		return this.writer.close();
	}

	/**
	 * Fills the buffer with the content of data and then flushes the buffer.
	 * The remaining data will be written after the flushing operation
	 * completed.
	 *
	 * @param data a data array longer than `this.index`
	 * @returns a `Promise` that resolves when the flushing operation completed
	 *          successfully
	 */
	private async writeAndFlush(data: Uint8Array): Promise<void> {
		const numberOfFreeBytesInBuffer = this.buffer.length - this.index;
		const chunk1 = data.subarray(0, numberOfFreeBytesInBuffer);
		const chunk2 = data.subarray(numberOfFreeBytesInBuffer);

		this.writeToBuffer(chunk1);
		await this.flush();
		return this.write(chunk2);
	}

	/**
	 * Writes `data` to the buffer.
	 *
	 * @param data a data array smaller than `this.index`
	 */
	private writeToBuffer(data: Uint8Array): void {
		this.buffer.set(data, this.index);
		this.index += data.length;
	}

	/**
	 * Writes the buffer to the stream and resets the buffer and index.
	 *
	 * @returns a `Promise` that resolves when the writing operation completed
	 *          successfully
	 */
	private flush(): Promise<void> {
		const promise = this.writer.write(this.buffer);
		this.buffer = new Uint8Array(this.bufferSize);
		this.index = 0;
		return promise;
	}
}
