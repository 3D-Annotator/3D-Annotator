import { useTools } from "./Tools";

export function useCursor() {
	const { selectedTool } = useTools();

	return selectedTool ? selectedTool.getCursor() : undefined;
}
