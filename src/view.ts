import { ItemView, WorkspaceLeaf } from "obsidian";

// This is an empty view used as a placeholder for the fullscreen stream of consciousness
export const FULLSCREEN_STREAM_VIEW = "fullscreen-stream";
export class FullscreenStreamView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}
	getViewType() {
		return FULLSCREEN_STREAM_VIEW;
	}
	getDisplayText() {
		return "Stream of Consciousness";
	}
}
