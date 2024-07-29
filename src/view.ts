import { ItemView, Workspace, WorkspaceLeaf } from "obsidian";

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

export async function getStreamLeaf(
	workspace: Workspace
): Promise<WorkspaceLeaf | undefined> {
	let leaf: WorkspaceLeaf;
	const leaves = workspace.getLeavesOfType(FULLSCREEN_STREAM_VIEW);
	if (leaves.length > 0) {
		leaf = leaves[0];
	} else {
		leaf = workspace.getLeaf("tab");
		await leaf.setViewState({
			type: FULLSCREEN_STREAM_VIEW,
			active: true,
		});
	}
	if (!leaf) {
		return;
	}
	workspace.revealLeaf(leaf);
	return leaf;
}

export function removeStreamLeaves(workspace: Workspace) {
	const leaves = workspace.getLeavesOfType(FULLSCREEN_STREAM_VIEW);
	for (const leaf of leaves) {
		leaf.detach();
	}
}
