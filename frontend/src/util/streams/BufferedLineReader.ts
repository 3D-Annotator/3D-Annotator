export interface BufferedLineReader {
	hasNextLine(): Promise<boolean>;
	hasBufferedNextLine(): boolean;

	nextLine(): Promise<string>;
	nextBufferedLine(): string;
}
