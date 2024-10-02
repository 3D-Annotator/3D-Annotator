import { type BufferedLineReader } from "./BufferedLineReader";

export const BUFFER_SIZE_1K = 1024;
export const BUFFER_SIZE_2K = 2048;
export const BUFFER_SIZE_4K = 4096;
export const BUFFER_SIZE_8K = 8192;
export const BUFFER_SIZE_16K = 16384;
export const BUFFER_SIZE_32K = 32768;
export const BUFFER_SIZE_64K = 65536;
export const BUFFER_SIZE_128K = 131072;

/**
 * A reader for readable streams of UTF-8 data that splits the content into
 * lines.
 *
 * The given readable stream is piped through a TextDecoderStream and split into
 * lines assuming that all lines, most notably the last one, are terminated by a
 * newline character (i.e. POSIX lines).
 *
 * All lines can be accessed asynchronously using the public methods.
 * The buffered lines, i.e. the ones contained in the last chunk read from the
 * underlying `ReadableStream` can be accessed synchronously.
 *
 * When reading many lines (e.g. in a loop) use the following idiom for the
 * best performance:
 *
 * @example
 *
 * // if uncertain that there will be a next line:
 * let line: string;
 * if (reader.hasBufferedNextLine()) {
 * 	line = reader.nextBuffered();
 * } else if (await reader.hasNextLines()) {
 * 	line = reader.nextBufferedLine();
 * } else {
 * 	// no next line
 * }
 *
 * // if certain that there will be a next line:
 * let line: string;
 * if (reader.hasBufferedNextLine()) {
 * 	line = reader.nextBufferedLine();
 * } else {
 * 	// if desired, the main thread could be unblocked here, e.g.
 *	// await waitForRender();
 * 	line = await reader.nextLine();
 * }
 */
export class ReadableStreamBufferedLineReader implements BufferedLineReader {
	private readonly reader: ReadableStreamDefaultReader<string>;

	private currentLines: string[] = [];
	private overflow = "";
	private currentLine = 0;

	/**
	 * As far as I know there is no way to control the chunk size returned by a
	 * `ReadableStream`. Therefore the specified buffer size has to be
	 * simulated:
	 *
	 * The whole chunk read from {@link reader} (possibly way bigger than the
	 * desired buffer size) is parsed and stored in {@link currentLines}. But
	 * every time the user has read {@link desiredBufferSize} bytes from said
	 * array, the call to {@link hasBufferedNextLine} returns `false`. This gives
	 * the user the possibility to handle a predefined number of bytes
	 * synchronously and then wait, e.g to unblock the main thread.
	 */
	private readonly desiredBufferSize: number;
	private bufferFactor = 1;
	private readProgress = 0;

	/**
	 * Constructs a new `ReadableStreamBufferedLineReader`.
	 *
	 * @param readableStream the `ReadableStream`
	 * @param bufferSize the desired buffer size in bytes
	 *                   (default: {@link BUFFER_SIZE_16K})
	 */
	constructor(
		readableStream: ReadableStream,
		bufferSize: number = BUFFER_SIZE_16K
	) {
		this.reader = readableStream
			.pipeThrough(new TextDecoderStream())
			.getReader();

		this.desiredBufferSize = bufferSize;
	}

	/**
	 * Determines if there is a next line.
	 *
	 * In order to determine if there is a next line, this method might need to
	 * wait for the `ReadableStream` to return a new value or to be done.
	 *
	 * If the returned `Promise` resolves to `true` **{@link nextBuffered()} is
	 * safe to call!**
	 *
	 * @see {@link ReadableStreamBufferedLineReader ReadableStreamBufferedLineReader's }
	 *      class documentation for examples.
	 *
	 * @returns a `Promise` resolving to true if there is a next line or false
	 *          otherwise
	 */
	public async hasNextLine(): Promise<boolean> {
		if (this.hasBufferedNextLine()) {
			return Promise.resolve(true);
		}

		return this.readNextChunk();
	}

	/**
	 * Returns `true` if there is a next line buffered.
	 *
	 * A return value of `false` does not necessarily mean that there is no
	 * next line. For this information call {@link hasNextLine()}.
	 *
	 * @see {@link ReadableStreamBufferedLineReader ReadableStreamBufferedLineReader's }
	 *      class documentation for examples.
	 *
	 * @returns `true` if there is a next line buffered, `false` otherwise
	 */
	public hasBufferedNextLine(): boolean {
		return (
			this.readProgress < this.desiredBufferSize * this.bufferFactor &&
			this.internalHasBufferedNextLine()
		);
	}

	/**
	 * Checks if there are next lines buffered internally.
	 *
	 * @returns `true` if there is a next line buffered, `false` otherwise
	 */
	private internalHasBufferedNextLine(): boolean {
		return this.currentLine < this.currentLines.length;
	}

	/**
	 * Asynchronously returns the next line **without** a terminating newline
	 * character.
	 *
	 * Only call this method if you are certain that there will be a next line.
	 *
	 * @see {@link ReadableStreamBufferedLineReader ReadableStreamBufferedLineReader's }
	 *      class documentation for examples.
	 *
	 * @returns a Promise resolving to the next line
	 * @throws no such element error if there is no next line
	 */
	public async nextLine(): Promise<string> {
		if (!this.hasBufferedNextLine()) {
			const hasNextLine = await this.readNextChunk();
			if (!hasNextLine) {
				throw new Error("No such element.");
			}
		}
		return this.nextBufferedLine();
	}

	/**
	 * Returns the next line in the buffer **without** a terminating newline
	 * character.
	 *
	 * This method is safe to call if **either** {@link hasBufferedNextLine()} or
	 * {@link hasNextLine()} returned `true` or a `Promise` resolving to `true`
	 * respectively.
	 *
	 * @see {@link ReadableStreamBufferedLineReader ReadableStreamBufferedLineReader's }
	 *      class documentation for examples.
	 *
	 * @returns the next line
	 * @throws no such element error if there is no next line
	 */
	public nextBufferedLine(): string {
		const nextLine = this.currentLines[this.currentLine++];
		if (nextLine === undefined) {
			throw new Error("No such element.");
		}

		this.readProgress += nextLine.length;

		return nextLine;
	}

	/**
	 * Reads from the reader.
	 *
	 * The returned `Promise` resolves to `true` if the next chunk was read
	 * successfully. It resolves to `false` if the reader is done.
	 *
	 * @returns a `Promise` that resolves when the reading operation completes
	 */
	private async readNextChunk(): Promise<boolean> {
		if (this.internalHasBufferedNextLine()) {
			this.bufferFactor++;
			return Promise.resolve(true);
		}

		const { done, value: nextChunk } = await this.reader.read();
		if (done) {
			return Promise.resolve(false);
		}

		this.prepareNextLines(nextChunk);
		return Promise.resolve(true);
	}

	/**
	 * Splits a chunk into lines.
	 *
	 * @param chunk the chunk read from the reader
	 */
	private prepareNextLines(chunk: string): void {
		// lines contains at least one element
		const lines = chunk.split("\n");
		// ! if chunks are big "chunk.split()" is a performance bottleneck

		/*
		Handle a line being separated into two chunks, for example:
		
		file:         "123\n456\n789\n"
			firstChunk:   "123\n45"
			secondChunk:  "6\n789\n"

			=> "45" is the overflow added to the first line of secondChunk.

			For secondChunk the overflow will be "" again:
			secondChunk.split("\n") => ["6", "789", ""]
		*/

		lines[0] = this.overflow + lines[0];
		this.overflow = lines.pop()!;

		this.currentLines = lines;
		this.currentLine = 0;

		this.readProgress = 0;
	}
}
