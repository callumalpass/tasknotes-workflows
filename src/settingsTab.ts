import { Notice, PluginSettingTab, Setting, type App } from "obsidian";
import { DEFAULT_WORKFLOW_FOLDER, DEFAULT_WORKFLOW_VIEW_PATH } from "./constants";
import type TaskNotesWorkflowsPlugin from "../main";

export class WorkflowsSettingsTab extends PluginSettingTab {
	constructor(app: App, private readonly plugin: TaskNotesWorkflowsPlugin) {
		super(app, plugin);
		this.plugin.registerEvent(
			this.plugin.i18n.on("locale-changed", () => {
				if (this.containerEl.isConnected) this.renderSettings();
			})
		);
	}

	override display(): void {
		this.renderSettings();
	}

	private renderSettings(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("tnw-settings");

		new Setting(containerEl).setName(this.plugin.t("settings.workflowFiles.heading")).setHeading();

		new Setting(containerEl)
			.setName(this.plugin.t("settings.workflowFiles.folder.name"))
			.setDesc(this.plugin.t("settings.workflowFiles.folder.description"))
			.addText((text) =>
				text.setValue(this.plugin.settings.workflowFolder).onChange((value) => {
					this.plugin.settings.workflowFolder = value.trim() || DEFAULT_WORKFLOW_FOLDER;
					void this.plugin.saveSettingsAndReload();
				})
			);

			new Setting(containerEl)
				.setName(this.plugin.t("settings.workflowFiles.base.name"))
				.setDesc(this.plugin.t("settings.workflowFiles.base.description"))
			.addText((text) =>
				text.setValue(this.plugin.settings.workflowViewPath).onChange((value) => {
					this.plugin.settings.workflowViewPath = value.trim() || DEFAULT_WORKFLOW_VIEW_PATH;
					void this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(this.plugin.t("settings.workflowFiles.createDefaults.name"))
			.setDesc(this.plugin.t("settings.workflowFiles.createDefaults.description"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.autoCreateDefaultWorkflows).onChange((value) => {
					this.plugin.settings.autoCreateDefaultWorkflows = value;
					void this.plugin.saveSettings();
				})
			);

			new Setting(containerEl)
				.setName(this.plugin.t("settings.workflowFiles.createBase.name"))
				.setDesc(this.plugin.t("settings.workflowFiles.createBase.description"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.autoCreateWorkflowView).onChange((value) => {
					this.plugin.settings.autoCreateWorkflowView = value;
					void this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(this.plugin.t("settings.workflowFiles.maintainDefaults.name"))
			.setDesc(this.plugin.t("settings.workflowFiles.maintainDefaults.description"))
			.addButton((button) =>
				button
					.setButtonText(this.plugin.t("common.maintain"))
					.setCta()
					.onClick(() => {
						void this.plugin.ensureDefaultFiles().then((result) => {
							this.plugin.showDefaultFilesNotice(result);
						});
					})
			);

		new Setting(containerEl).setName(this.plugin.t("settings.triggers.heading")).setHeading();

			new Setting(containerEl)
				.setName(this.plugin.t("settings.triggers.tasknotesEvents.name"))
				.setDesc(this.plugin.t("settings.triggers.tasknotesEvents.description"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enableTaskEventTriggers).onChange((value) => {
					this.plugin.settings.enableTaskEventTriggers = value;
					void this.plugin.saveSettingsAndReload();
				})
			);

		new Setting(containerEl)
			.setName(this.plugin.t("settings.triggers.scheduled.name"))
			.setDesc(this.plugin.t("settings.triggers.scheduled.description"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enableScheduledTriggers).onChange((value) => {
					this.plugin.settings.enableScheduledTriggers = value;
					void this.plugin.saveSettingsAndReload();
				})
			);

		new Setting(containerEl)
			.setName(this.plugin.t("settings.triggers.obsidian.name"))
			.setDesc(this.plugin.t("settings.triggers.obsidian.description"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enableObsidianTriggers).onChange((value) => {
					this.plugin.settings.enableObsidianTriggers = value;
					void this.plugin.saveSettingsAndReload();
				})
			);

		new Setting(containerEl)
			.setName(this.plugin.t("settings.triggers.minInterval.name"))
			.setDesc(this.plugin.t("settings.triggers.minInterval.description"))
			.addText((text) =>
				text.setValue(String(this.plugin.settings.minIntervalMs)).onChange((value) => {
					const next = Number(value);
					if (Number.isFinite(next)) {
						this.plugin.settings.minIntervalMs = Math.max(30_000, next);
						void this.plugin.saveSettingsAndReload();
					}
				})
			);

		new Setting(containerEl).setName(this.plugin.t("settings.runLogs.heading")).setHeading();

		new Setting(containerEl)
			.setName(this.plugin.t("settings.runLogs.folder.name"))
			.setDesc(this.plugin.t("settings.runLogs.folder.description"))
			.addText((text) =>
				text.setValue(this.plugin.settings.runLogRoot).onChange((value) => {
					this.plugin.settings.runLogRoot = value.trim();
					void this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(this.plugin.t("settings.runLogs.level.name"))
			.setDesc(this.plugin.t("settings.runLogs.level.description"))
			.addDropdown((dropdown) =>
				dropdown
					.addOption("summary", this.plugin.t("settings.runLogs.level.options.summary"))
					.addOption("inputs", this.plugin.t("settings.runLogs.level.options.inputs"))
					.addOption("inputs-and-outputs", this.plugin.t("settings.runLogs.level.options.inputsAndOutputs"))
					.setValue(this.plugin.settings.runLogLevel)
					.onChange((value) => {
						this.plugin.settings.runLogLevel = value as typeof this.plugin.settings.runLogLevel;
						void this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(this.plugin.t("settings.runLogs.retention.name"))
			.setDesc(this.plugin.t("settings.runLogs.retention.description"))
			.addText((text) =>
				text.setValue(String(this.plugin.settings.maxRunsPerWorkflow)).onChange((value) => {
					const next = Number(value);
					if (Number.isFinite(next)) {
						this.plugin.settings.maxRunsPerWorkflow = Math.max(10, next);
						void this.plugin.saveSettings();
					}
				})
			);

		new Setting(containerEl)
			.setName(this.plugin.t("settings.runLogs.clear.name"))
			.setDesc(this.plugin.t("settings.runLogs.clear.description"))
			.addButton((button) =>
				button.setButtonText(this.plugin.t("common.clear")).onClick(() => {
					void this.plugin.clearRunHistory().then(() => new Notice(this.plugin.t("notices.runHistoryCleared")));
				})
			);

		new Setting(containerEl).setName(this.plugin.t("settings.language.heading")).setHeading();

		new Setting(containerEl)
			.setName(this.plugin.t("settings.language.name"))
			.setDesc(this.plugin.t("settings.language.dropdownDescription"))
			.addDropdown((dropdown) => {
				dropdown.addOption("system", this.plugin.t("common.systemDefault"));
				for (const code of this.plugin.i18n.getAvailableLocales()) {
					dropdown.addOption(code, this.plugin.i18n.getNativeLanguageName(code));
				}
				dropdown.setValue(this.plugin.settings.uiLanguage ?? "system").onChange((value) => {
					this.plugin.settings.uiLanguage = value;
					this.plugin.i18n.setLocale(value);
					void this.plugin.saveSettings();
				});
			});
	}
}
