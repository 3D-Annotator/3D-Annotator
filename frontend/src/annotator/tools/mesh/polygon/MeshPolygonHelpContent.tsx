import { useI18nContext } from "i18n/i18n-react";

export function MeshPolygonHelpContent() {
	const { LL } = useI18nContext();
	return (
		<table className="border-separate border-spacing-x-3 border-spacing-y-2">
			<tbody>
				<tr>
					<td>{LL.ADD_CORNER() + ":"}</td>
					<td>
						<i>{LL.LEFT_MOUSE_BUTTON()}</i>
					</td>
				</tr>
				<tr>
					<td>{LL.POLYGON_PREVIEW() + ":"} </td>
					<td>
						<kbd className="kbd">{LL.SHIFT_KEY()}</kbd>
					</td>
				</tr>
				<tr>
					<td>{LL.DELETE_LAST_CORNER() + ":"}</td>
					<td>
						<kbd className="kbd">d</kbd> {LL.OR()}{" "}
						<kbd className="kbd">{LL.DELETE_KEY()}</kbd>
					</td>
				</tr>
				<tr>
					<td>{LL.CLOSE_POLYGON() + ":"}</td>
					<td>
						<kbd className="kbd">a</kbd> {LL.OR()}{" "}
						<kbd className="kbd">{LL.ENTER_KEY()}</kbd>
					</td>
				</tr>
				<tr>
					<td>{LL.ANNOTATE() + ":"} </td>
					<td>
						<kbd className="kbd">a</kbd> {LL.OR()}{" "}
						<kbd className="kbd">{LL.ENTER_KEY()}</kbd>
					</td>
				</tr>
				<tr>
					<td>{LL.CANCEL() + ":"} </td>
					<td>
						<kbd className="kbd">{LL.ESCAPE_KEY()}</kbd>
					</td>
				</tr>
			</tbody>
		</table>
	);
}
