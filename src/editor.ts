import { Editor } from "obsidian";

export function deleteLastCharacter(editor: Editor) {
	const start = editor.offsetToPos(
		editor.posToOffset(editor.getCursor()) - 1
	);
	const end = editor.getCursor();
	editor.replaceRange("", start, end);
}
