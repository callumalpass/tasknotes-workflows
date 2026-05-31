import { Notice, PluginSettingTab, Setting, type App } from "obsidian";
import { DEFAULT_WORKFLOW_FOLDER, DEFAULT_WORKFLOW_VIEW_PATH } from "./constants";
import type TaskNotesWorkflowsPlugin from "../main";

const TASKNOTES_LABEL = "TaskNotes";

export class WorkflowsSettingsTab extends PluginSettingTab {
	constructor(app: App, private readonly plugin: TaskNotesWorkflowsPlugin) {
		super(app, plugin);
	}

	override display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("tnw-settings");

		new Setting(containerEl).setName("Workflow files").setHeading();

		new Setting(containerEl)
			.setName("Workflow folder")
			.setDesc("Vault folder containing Markdown workflow definitions.")
			.addText((text) =>
				text.setValue(this.plugin.settings.workflowFolder).onChange((value) => {
					this.plugin.settings.workflowFolder = value.trim() || DEFAULT_WORKFLOW_FOLDER;
					void this.plugin.saveSettingsAndReload();
				})
			);

			new Setting(containerEl)
				.setName("Workflow base")
				.setDesc("Vault path for the generated bases workflow view.")
			.addText((text) =>
				text.setValue(this.plugin.settings.workflowViewPath).onChange((value) => {
					this.plugin.settings.workflowViewPath = value.trim() || DEFAULT_WORKFLOW_VIEW_PATH;
					void this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Create workflow defaults")
			.setDesc("Write example workflow notes when the plugin loads or when defaults are maintained.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.autoCreateDefaultWorkflows).onChange((value) => {
					this.plugin.settings.autoCreateDefaultWorkflows = value;
					void this.plugin.saveSettings();
				})
			);

			new Setting(containerEl)
				.setName("Create workflow base")
				.setDesc("Write the generated bases workflow view when the plugin loads or when defaults are maintained.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.autoCreateWorkflowView).onChange((value) => {
					this.plugin.settings.autoCreateWorkflowView = value;
					void this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Maintain defaults")
			.setDesc("Create missing workflow notes and the workflow base without overwriting existing files.")
			.addButton((button) =>
				button
					.setButtonText("Maintain")
					.setCta()
					.onClick(() => {
						void this.plugin.ensureDefaultFiles().then((result) => {
							const created = [...result.workflows, ...(result.view ? [result.view] : [])];
							new Notice(
								created.length > 0
									? `Created ${created.length} default file${created.length === 1 ? "" : "s"}.`
									: "Default workflow files are already present."
							);
						});
					})
			);

		new Setting(containerEl).setName("Triggers").setHeading();

			new Setting(containerEl)
				.setName(`${TASKNOTES_LABEL} event triggers`)
				.setDesc(`Run workflows from ${TASKNOTES_LABEL} runtime API events such as task.status.changed.`)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enableTaskEventTriggers).onChange((value) => {
					this.plugin.settings.enableTaskEventTriggers = value;
					void this.plugin.saveSettingsAndReload();
				})
			);

		new Setting(containerEl)
			.setName("Scheduled triggers")
			.setDesc("Run cron and interval workflows while Obsidian is open.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enableScheduledTriggers).onChange((value) => {
					this.plugin.settings.enableScheduledTriggers = value;
					void this.plugin.saveSettingsAndReload();
				})
			);

		new Setting(containerEl)
			.setName("Advanced Obsidian triggers")
			.setDesc("Allow Obsidian vault and workspace triggers. Keep path filters narrow.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enableObsidianTriggers).onChange((value) => {
					this.plugin.settings.enableObsidianTriggers = value;
					void this.plugin.saveSettingsAndReload();
				})
			);

		new Setting(containerEl)
			.setName("Minimum interval")
			.setDesc("Lowest allowed interval trigger frequency in milliseconds.")
			.addText((text) =>
				text.setValue(String(this.plugin.settings.minIntervalMs)).onChange((value) => {
					const next = Number(value);
					if (Number.isFinite(next)) {
						this.plugin.settings.minIntervalMs = Math.max(30_000, next);
						void this.plugin.saveSettingsAndReload();
					}
				})
			);

		new Setting(containerEl).setName("Run logs").setHeading();

		new Setting(containerEl)
			.setName("Run log folder")
			.setDesc("Optional vault path for run summaries and detail files. Leave blank to use this plugin's config folder.")
			.addText((text) =>
				text.setValue(this.plugin.settings.runLogRoot).onChange((value) => {
					this.plugin.settings.runLogRoot = value.trim();
					void this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Run log level")
			.setDesc("Controls how much detail is kept in run records.")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("summary", "Summary")
					.addOption("inputs", "Inputs")
					.addOption("inputs-and-outputs", "Inputs and outputs")
					.setValue(this.plugin.settings.runLogLevel)
					.onChange((value) => {
						this.plugin.settings.runLogLevel = value as typeof this.plugin.settings.runLogLevel;
						void this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Runs retained per workflow")
			.setDesc("Old detail files are deleted after this limit.")
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
			.setName("Clear run history")
			.setDesc("Delete plugin-local workflow run logs.")
			.addButton((button) =>
				button.setButtonText("Clear").onClick(() => {
					void this.plugin.clearRunHistory().then(() => new Notice("Workflow run history cleared."));
				})
			);
	}
}
