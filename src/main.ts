import { Editor, MarkdownView, Plugin, WorkspaceLeaf } from "obsidian";
import {
	DEFAULT_SETTINGS,
	StreamOfConsciousnessSettings,
	StreamSettingTab,
} from "./settings";
import { deleteLastCharacter } from "./editor";
import { FULLSCREEN_STREAM_VIEW, FullscreenStreamView } from "./view";

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
				this.activateView(editor);
			},
		});

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "todays-journal",
			name: "Open today's journal entry",

			editorCallback: async (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
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

	async activateView(editor: Editor) {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
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
			console.error("Failed to open fullscreen stream of consciousness");
			return;
		}

		workspace.revealLeaf(leaf);
		this.openStreamOfConsciousness(leaf, editor);
	}

	async openStreamOfConsciousness(leaf: WorkspaceLeaf, activeEditor: Editor) {
		const container = leaf.view.containerEl.children[1];
		container.empty();
		container.requestFullscreen();

		const fullScreenBackground = document.createElement("div");
		fullScreenBackground.addClass("soc-bgContainer");
		container.insertBefore(fullScreenBackground, container.firstChild);
		const centeredContainer = document.createElement("div");
		centeredContainer.addClass("soc-centeredContainer");
		// <bdi> needed for correct rendering of RTL text
		const bdi = centeredContainer.appendChild(
			document.createElement("bdi")
		);
		// Add fade to left overlay
		const fadeToLeftOverlay = centeredContainer.appendChild(
			document.createElement("div")
		);
		fadeToLeftOverlay.addClass("soc-fadeOverlay");
		// Add cursor
		const cursorDiv = centeredContainer.appendChild(
			document.createElement("div")
		);
		cursorDiv.addClass("soc-cursor");

		const setCursorSolid = () => {
			cursorDiv.addClass("soc-cursor-on");
		};
		const setCursorHidden = () => {
			cursorDiv.removeClass("soc-cursor-on");
		};
		const toggleCursor = () => {
			cursorDiv.classList.contains("soc-cursor-on")
				? setCursorHidden()
				: setCursorSolid();
		};
		fullScreenBackground.appendChild(centeredContainer);

		let blinkInterval: number;
		const startBlinkInterval = () => {
			setCursorHidden();
			blinkInterval = window.setInterval(toggleCursor, 500);
		};
		let cursorBlinkDelay = window.setTimeout(startBlinkInterval, 500);

		const noModifiers = (e: KeyboardEvent) =>
			!e.ctrlKey && !e.altKey && !e.metaKey;

		const keyHandler = (e: KeyboardEvent) => {
			if (
				e.key === "Backspace" &&
				bdi.innerHTML.length &&
				noModifiers(e) &&
				this.settings.allowBackspace
			) {
				if (bdi.innerHTML.length && activeEditor) {
					deleteLastCharacter(activeEditor);
				}
				bdi.innerHTML = bdi.innerHTML.slice(0, -1);
			} else if (e.key.length === 1 && noModifiers(e) && activeEditor) {
				// prevent double spaces
				if (e.key === " " && bdi.innerHTML.slice(-1) === " ") {
					return;
				}
				bdi.innerHTML += e.key;
				activeEditor.replaceSelection(e.key);
			} else {
				e.preventDefault();
				e.stopPropagation();
				return;
			}

			// keep cursor visible
			setCursorSolid();
			window.clearTimeout(cursorBlinkDelay);
			window.clearInterval(blinkInterval);
			cursorBlinkDelay = window.setTimeout(startBlinkInterval, 500);

			// add padding if last character is a space
			if (bdi.innerHTML.slice(-1) === " ") {
				bdi.style.paddingRight = "0.4em";
			} else {
				bdi.style.paddingRight = "0";
			}
		};
		document.addEventListener("keydown", keyHandler);

		// cleanup on exit
		container.addEventListener("fullscreenchange", () => {
			if (!document.fullscreenElement) {
				document.removeEventListener("keydown", keyHandler);
				window.clearTimeout(cursorBlinkDelay);
				window.clearInterval(blinkInterval);
				this.app.workspace
					.getLeavesOfType(FULLSCREEN_STREAM_VIEW)
					.forEach((leaf) => {
						leaf.detach();
					});
				fullScreenBackground.remove();
			}
		});
	}
}
