import { Editor } from "obsidian";

// Delete the character before the cursor
export function deleteLastCharacter(editor: Editor) {
	const start = editor.offsetToPos(
		editor.posToOffset(editor.getCursor()) - 1
	);
	const end = editor.getCursor();
	editor.replaceRange("", start, end);
}
