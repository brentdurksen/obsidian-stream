import { Editor, Plugin } from "obsidian";
import {
	DEFAULT_SETTINGS,
	StreamOfConsciousnessSettings,
	StreamSettingTab,
} from "./settings";
import { deleteLastCharacter } from "./editor";
import {
	FULLSCREEN_STREAM_VIEW,
	FullscreenStreamView,
	getStreamLeaf,
	removeStreamLeaves,
} from "./view";
import { Cursor } from "./cursor";

export default class StreamOfConsciousnessPlugin extends Plugin {
	settings: StreamOfConsciousnessSettings;

	async onload() {
		await this.loadSettings();
		this.registerView(
			FULLSCREEN_STREAM_VIEW,
			(leaf) => new FullscreenStreamView(leaf)
		);

		// Add command to open fullscreen stream of consciousness
		this.addCommand({
			id: "fullscreen-stream",
			name: "Fullscreen stream of consciousness",
			editorCallback: async (editor, view) => {
				this.activateStream(editor);
			},
		});

		// Add settings tab
		this.addSettingTab(new StreamSettingTab(this.app, this));
	}

	onunload() {
		removeStreamLeaves(this.app.workspace);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateStream(editor: Editor) {
		// Create fullscreen container
		const leaf = await getStreamLeaf(this.app.workspace);
		if (!leaf) {
			console.error("Failed to create fullscreen container");
			return;
		}
		const container = leaf.view.containerEl.children[1];
		container.empty();
		container.requestFullscreen();

		// Set background
		const fullScreenBackground = document.createElement("div");
		fullScreenBackground.classList.add("soc-bgContainer");
		container.insertBefore(fullScreenBackground, container.firstChild);

		// Centered container
		const centeredContainer = document.createElement("div");
		centeredContainer.classList.add("soc-centeredContainer");
		fullScreenBackground.appendChild(centeredContainer);

		// <bdi> renders punctuation correctly in RTL text
		const bdi = document.createElement("bdi");
		bdi.classList.add("soc-text");
		centeredContainer.appendChild(bdi);

		// Cursor
		const cursor = new Cursor();
		centeredContainer.appendChild(cursor.element);

		// Add keyboard event listeners
		const noModifierKeys = (e: KeyboardEvent) =>
			!e.ctrlKey && !e.altKey && !e.metaKey;
		const keyDownHandler = (e: KeyboardEvent) => {
			if (
				e.key === "Backspace" &&
				bdi.innerHTML.length &&
				noModifierKeys(e) &&
				this.settings.allowBackspace
			) {
				bdi.innerHTML = bdi.innerHTML.slice(0, -1);
				deleteLastCharacter(editor);
			} else if (e.key.length === 1 && noModifierKeys(e) && editor) {
				bdi.innerHTML += e.key;
				editor.replaceSelection(e.key);
			} else {
				e.preventDefault();
				e.stopPropagation();
				return;
			}
			// keep cursor visible while typing
			cursor.reset();
		};
		document.addEventListener("keydown", keyDownHandler);

		// cleanup when exiting fullscreen
		const fullscreenChangeHandler = (e: Event) => {
			if (document.fullscreenElement !== container) {
				cursor.unload();
				document.removeEventListener("keydown", keyDownHandler);
				fullScreenBackground.remove();
				removeStreamLeaves(this.app.workspace);
				e.target?.removeEventListener(
					"fullscreenchange",
					fullscreenChangeHandler
				);
			}
		};
		container.addEventListener("fullscreenchange", fullscreenChangeHandler);
	}
}
