export interface ImageRenderer {
	/**
	 * Returns the current render content.
	 */
	render(): Promise<Blob>;
}
