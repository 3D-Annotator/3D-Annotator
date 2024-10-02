import {
	AsyncUnzipInflate,
	AsyncZipDeflate,
	Unzip,
	Zip,
	type UnzipFile,
} from "fflate";
import { type Observer } from "~entity/Types";
import { wait } from "../Timeout";
import { type NamedStream } from "./StreamUtils";

/**
 * Creates a new ReadableStream that zips the data provided by the named streams.
 * Each stream is written to a own file in the zip folders root.
 *
 * @param streams the streams to be zipped
 * @returns the ReadableStream
 */
export function zipStream(
	streams: NamedStream[],
	onComplete?: Observer<void>
): ReadableStream<Uint8Array> {
	/**
	 * This function is called immediately after the ReadableStream is constructed and sets up the stream.
	 *
	 * @param controller the controller
	 */
	function start(controller: ReadableStreamController<Uint8Array>) {
		const zip = new Zip();

		zip.ondata = (err, data, final) => {
			if (err) {
				console.error("ZipStream error (ondata)", err, data, final);
			}

			controller.enqueue(data);

			if (final) {
				if (onComplete) onComplete();
				controller.close();
				return;
			}
		};

		for (const { stream, name } of streams) {
			const deflate = new AsyncZipDeflate(name);
			zip.add(deflate);

			const reader = stream.getReader();

			reader
				.read()
				.then(function pushChunk({ value, done }) {
					if (done) {
						deflate.push(new Uint8Array(), true);
						return;
					}
					deflate.push(value, done);
					return reader.read().then<void>(pushChunk);
				})
				.catch((error) => {
					throw new Error("Error while pushing junk", {
						cause: error,
					});
				});
		}
		zip.end();
	}

	return new ReadableStream<Uint8Array>({
		start: start,
	});
}

export function unzipStream(
	stream: ReadableStream<Uint8Array>,
	onNewFile: Observer<NamedStream>
) {
	const unzip = new Unzip();
	unzip.register(AsyncUnzipInflate);

	function onFile(file: UnzipFile) {
		function start(controller: ReadableStreamController<Uint8Array>) {
			file.ondata = (err, data, final) => {
				if (err) {
					console.error(
						"UnzipStream error (ondata)",
						err,
						data,
						final
					);
				}

				controller.enqueue(data);

				if (final) {
					controller.close();
					return;
				}
			};

			file.start();
		}

		onNewFile({ stream: new ReadableStream({ start }), name: file.name });
	}

	// spell-checker:disable-next-line
	unzip.onfile = onFile;

	const reader = stream.getReader();

	reader
		.read()
		.then(async function pushChunk({ value, done }) {
			if (done) {
				unzip.push(new Uint8Array(), true);
				return;
			}
			unzip.push(value, done);
			await wait();
			return reader.read().then<void>(pushChunk);
		})
		.catch((error) => {
			throw new Error("Error while pushing junk", {
				cause: error,
			});
		});
}
