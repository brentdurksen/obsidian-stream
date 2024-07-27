import StreamOfConsciousnessPlugin from "./main";
import { PluginSettingTab, App, Setting } from "obsidian";

export interface StreamOfConsciousnessSettings {
	allowBackspace: boolean;
}

export const DEFAULT_SETTINGS: StreamOfConsciousnessSettings = {
	allowBackspace: true,
};

export class StreamSettingTab extends PluginSettingTab {
	plugin: StreamOfConsciousnessPlugin;

	constructor(app: App, plugin: StreamOfConsciousnessPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Allow Backspace")
			.setDesc(
				"Allow Backspace key in fullscreen stream of consciousness view"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.allowBackspace)
					.onChange(async (value) => {
						this.plugin.settings.allowBackspace = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
