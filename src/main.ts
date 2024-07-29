import { Editor, MarkdownView, Plugin } from "obsidian";
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

		this.addCommand({
			id: "fullscreen-stream",
			name: "Fullscreen stream of consciousness",
			editorCallback: async (editor, view) => {
				this.activateStream(editor);
			},
		});

		// TODO: move to separate plugin
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "todays-journal",
			name: "Open today's journal entry",

			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const today = new Date();
				const path = `Journal/${today.toISOString().slice(0, 10)}.md`;

				let file = this.app.vault.getFileByPath(path);
				if (!file) {
					file = await this.app.vault.create(path, "");
				}
				const link = this.app.fileManager.generateMarkdownLink(
					file,
					this.app.workspace.getActiveFile()?.path ?? ""
				);
				editor.replaceSelection(link);
				this.app.workspace.openLinkText(path, path, true);
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new StreamSettingTab(this.app, this));
	}

	onunload() {}

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
		centeredContainer.appendChild(bdi);

		// Fade overlay
		const fadeToLeftOverlay = document.createElement("div");
		fadeToLeftOverlay.classList.add("soc-fadeOverlay");
		centeredContainer.appendChild(fadeToLeftOverlay);

		// Cursor
		const cursor = new Cursor();
		centeredContainer.appendChild(cursor.element);

		const noModifiers = (e: KeyboardEvent) =>
			!e.ctrlKey && !e.altKey && !e.metaKey;

		const keyHandler = (e: KeyboardEvent) => {
			if (
				e.key === "Backspace" &&
				bdi.innerHTML.length &&
				noModifiers(e) &&
				this.settings.allowBackspace
			) {
				if (bdi.innerHTML.length && editor) {
					deleteLastCharacter(editor);
				}
				bdi.innerHTML = bdi.innerHTML.slice(0, -1);
			} else if (e.key.length === 1 && noModifiers(e) && editor) {
				// prevent double spaces
				if (e.key === " " && bdi.innerHTML.slice(-1) === " ") {
					return;
				}
				bdi.innerHTML += e.key;
				editor.replaceSelection(e.key);
			} else {
				e.preventDefault();
				e.stopPropagation();
				return;
			}

			// keep cursor visible while typing
			cursor.reset();

			// hack to add padding if last character is a space
			if (bdi.innerHTML.slice(-1) === " ") {
				bdi.style.paddingRight = "0.4em";
			} else {
				bdi.style.paddingRight = "0";
			}
		};
		document.addEventListener("keydown", keyHandler);

		// cleanup when exiting fullscreen
		const handleFullscreenChange = (e: Event) => {
			if (document.fullscreenElement !== container) {
				cursor.unload();
				document.removeEventListener("keydown", keyHandler);
				fullScreenBackground.remove();
				removeStreamLeaves(this.app.workspace);
				e.target?.removeEventListener(
					"fullscreenchange",
					handleFullscreenChange
				);
			}
		};
		container.addEventListener("fullscreenchange", handleFullscreenChange);
	}
}
