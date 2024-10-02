export interface BufferedWriter {
	write(data: Uint8Array): Promise<void>;
	writeSync(data: Uint8Array): Promise<void> | null;

	close(): Promise<void>;
}
