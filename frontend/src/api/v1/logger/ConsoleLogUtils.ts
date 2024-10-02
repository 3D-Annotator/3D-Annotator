/*
 *   +++ CONSOLE LOG UTILITY METHODS +++
 */

export function dirGroup(header: string, content?: object, collapsed = true) {
	if (collapsed) {
		console.groupCollapsed(header);
	} else {
		console.group(header);
	}
	console.dir(content);
	console.groupEnd();
}

export function logGroup(header: string, content?: unknown, collapsed = true) {
	if (collapsed) {
		console.groupCollapsed(header);
	} else {
		console.group(header);
	}
	console.log(content);
	console.groupEnd();
}

export function logJSONGroup(
	header: string,
	content?: object,
	collapsed = true
) {
	logGroup(header, JSON.stringify(content, undefined, 2), collapsed);
}

export function logJSON(
	content?: object,
	replacer?: Parameters<typeof JSON.stringify>[1]
) {
	console.log(JSON.stringify(content, replacer, 2));
}

export function date(): string {
	return new Date().toLocaleTimeString();
}
