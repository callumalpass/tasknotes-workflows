import { Notice, PluginSettingTab, Setting, type App, type TextComponent } from "obsidian";
import { DEFAULT_WORKFLOW_FOLDER, DEFAULT_WORKFLOW_VIEW_PATH } from "./constants";
import type TaskNotesWorkflowsPlugin from "../main";

export class WorkflowsSettingsTab extends PluginSettingTab {
	constructor(app: App, private readonly workflowsPlugin: TaskNotesWorkflowsPlugin) {
		super(app, workflowsPlugin);
		this.workflowsPlugin.registerEvent(
			this.workflowsPlugin.i18n.on("locale-changed", () => {
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

		new Setting(containerEl).setName(this.workflowsPlugin.t("settings.workflowFiles.heading")).setHeading();

		new Setting(containerEl)
			.setName(this.workflowsPlugin.t("settings.workflowFiles.folder.name"))
			.setDesc(this.workflowsPlugin.t("settings.workflowFiles.folder.description"))
			.addText((text) => {
				text.setValue(this.workflowsPlugin.settings.workflowFolder);
				this.commitTextOnFinish(text, (value) => {
					this.updateWorkflowFolder(value);
				});
			});

			new Setting(containerEl)
				.setName(this.workflowsPlugin.t("settings.workflowFiles.base.name"))
				.setDesc(this.workflowsPlugin.t("settings.workflowFiles.base.description"))
			.addText((text) =>
				text.setValue(this.workflowsPlugin.settings.workflowViewPath).onChange((value) => {
					this.workflowsPlugin.settings.workflowViewPath = value.trim() || DEFAULT_WORKFLOW_VIEW_PATH;
					void this.workflowsPlugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(this.workflowsPlugin.t("settings.workflowFiles.createDefaults.name"))
			.setDesc(this.workflowsPlugin.t("settings.workflowFiles.createDefaults.description"))
			.addToggle((toggle) =>
				toggle.setValue(this.workflowsPlugin.settings.autoCreateDefaultWorkflows).onChange((value) => {
					this.workflowsPlugin.settings.autoCreateDefaultWorkflows = value;
					void this.workflowsPlugin.saveSettings();
				})
			);

			new Setting(containerEl)
				.setName(this.workflowsPlugin.t("settings.workflowFiles.createBase.name"))
				.setDesc(this.workflowsPlugin.t("settings.workflowFiles.createBase.description"))
			.addToggle((toggle) =>
				toggle.setValue(this.workflowsPlugin.settings.autoCreateWorkflowView).onChange((value) => {
					this.workflowsPlugin.settings.autoCreateWorkflowView = value;
					void this.workflowsPlugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(this.workflowsPlugin.t("settings.workflowFiles.maintainDefaults.name"))
			.setDesc(this.workflowsPlugin.t("settings.workflowFiles.maintainDefaults.description"))
			.addButton((button) =>
				button
					.setButtonText(this.workflowsPlugin.t("common.maintain"))
					.setCta()
					.onClick(() => {
						void this.workflowsPlugin.ensureDefaultFiles().then((result) => {
							this.workflowsPlugin.showDefaultFilesNotice(result);
						});
					})
			);

		new Setting(containerEl).setName(this.workflowsPlugin.t("settings.triggers.heading")).setHeading();

			new Setting(containerEl)
				.setName(this.workflowsPlugin.t("settings.triggers.tasknotesEvents.name"))
				.setDesc(this.workflowsPlugin.t("settings.triggers.tasknotesEvents.description"))
			.addToggle((toggle) =>
				toggle.setValue(this.workflowsPlugin.settings.enableTaskEventTriggers).onChange((value) => {
					this.workflowsPlugin.settings.enableTaskEventTriggers = value;
					void this.workflowsPlugin.saveSettingsAndReload();
				})
			);

		new Setting(containerEl)
			.setName(this.workflowsPlugin.t("settings.triggers.scheduled.name"))
			.setDesc(this.workflowsPlugin.t("settings.triggers.scheduled.description"))
			.addToggle((toggle) =>
				toggle.setValue(this.workflowsPlugin.settings.enableScheduledTriggers).onChange((value) => {
					this.workflowsPlugin.settings.enableScheduledTriggers = value;
					void this.workflowsPlugin.saveSettingsAndReload();
				})
			);

		new Setting(containerEl)
			.setName(this.workflowsPlugin.t("settings.triggers.obsidian.name"))
			.setDesc(this.workflowsPlugin.t("settings.triggers.obsidian.description"))
			.addToggle((toggle) =>
				toggle.setValue(this.workflowsPlugin.settings.enableObsidianTriggers).onChange((value) => {
					this.workflowsPlugin.settings.enableObsidianTriggers = value;
					void this.workflowsPlugin.saveSettingsAndReload();
				})
			);

		new Setting(containerEl)
			.setName(this.workflowsPlugin.t("settings.triggers.minInterval.name"))
			.setDesc(this.workflowsPlugin.t("settings.triggers.minInterval.description"))
			.addText((text) =>
				text.setValue(String(this.workflowsPlugin.settings.minIntervalMs)).onChange((value) => {
					const next = Number(value);
					if (Number.isFinite(next)) {
						this.workflowsPlugin.settings.minIntervalMs = Math.max(30_000, next);
						void this.workflowsPlugin.saveSettingsAndReload();
					}
				})
			);

		new Setting(containerEl).setName(this.workflowsPlugin.t("settings.runLogs.heading")).setHeading();

		new Setting(containerEl)
			.setName(this.workflowsPlugin.t("settings.runLogs.folder.name"))
			.setDesc(this.workflowsPlugin.t("settings.runLogs.folder.description"))
			.addText((text) =>
				text.setValue(this.workflowsPlugin.settings.runLogRoot).onChange((value) => {
					this.workflowsPlugin.settings.runLogRoot = value.trim();
					void this.workflowsPlugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(this.workflowsPlugin.t("settings.runLogs.level.name"))
			.setDesc(this.workflowsPlugin.t("settings.runLogs.level.description"))
			.addDropdown((dropdown) =>
				dropdown
					.addOption("summary", this.workflowsPlugin.t("settings.runLogs.level.options.summary"))
					.addOption("inputs", this.workflowsPlugin.t("settings.runLogs.level.options.inputs"))
					.addOption("inputs-and-outputs", this.workflowsPlugin.t("settings.runLogs.level.options.inputsAndOutputs"))
					.setValue(this.workflowsPlugin.settings.runLogLevel)
					.onChange((value) => {
						this.workflowsPlugin.settings.runLogLevel = value as typeof this.workflowsPlugin.settings.runLogLevel;
						void this.workflowsPlugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(this.workflowsPlugin.t("settings.runLogs.retention.name"))
			.setDesc(this.workflowsPlugin.t("settings.runLogs.retention.description"))
			.addText((text) =>
				text.setValue(String(this.workflowsPlugin.settings.maxRunsPerWorkflow)).onChange((value) => {
					const next = Number(value);
					if (Number.isFinite(next)) {
						this.workflowsPlugin.settings.maxRunsPerWorkflow = Math.max(10, next);
						void this.workflowsPlugin.saveSettings();
					}
				})
			);

		new Setting(containerEl)
			.setName(this.workflowsPlugin.t("settings.runLogs.clear.name"))
			.setDesc(this.workflowsPlugin.t("settings.runLogs.clear.description"))
			.addButton((button) =>
				button.setButtonText(this.workflowsPlugin.t("common.clear")).onClick(() => {
					void this.workflowsPlugin.clearRunHistory().then(() => new Notice(this.workflowsPlugin.t("notices.runHistoryCleared")));
				})
			);

		new Setting(containerEl).setName(this.workflowsPlugin.t("settings.language.heading")).setHeading();

		new Setting(containerEl)
			.setName(this.workflowsPlugin.t("settings.language.name"))
			.setDesc(this.workflowsPlugin.t("settings.language.dropdownDescription"))
			.addDropdown((dropdown) => {
				dropdown.addOption("system", this.workflowsPlugin.t("common.systemDefault"));
				for (const code of this.workflowsPlugin.i18n.getAvailableLocales()) {
					dropdown.addOption(code, this.workflowsPlugin.i18n.getNativeLanguageName(code));
				}
				dropdown.setValue(this.workflowsPlugin.settings.uiLanguage ?? "system").onChange((value) => {
					this.workflowsPlugin.settings.uiLanguage = value;
					this.workflowsPlugin.i18n.setLocale(value);
					void this.workflowsPlugin.saveSettings();
				});
			});
	}

	private updateWorkflowFolder(value: string): void {
		const next = value.trim() || DEFAULT_WORKFLOW_FOLDER;
		if (next === this.workflowsPlugin.settings.workflowFolder) return;
		this.workflowsPlugin.settings.workflowFolder = next;
		void this.workflowsPlugin.saveSettingsAndReload();
	}

	private commitTextOnFinish(text: TextComponent, onCommit: (value: string) => void): void {
		const commit = () => {
			onCommit(text.getValue());
		};
		text.inputEl.addEventListener("blur", commit);
		text.inputEl.addEventListener("keydown", (event) => {
			if (event.key !== "Enter") return;
			event.preventDefault();
			commit();
			text.inputEl.blur();
		});
	}
}
