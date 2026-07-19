import { ButtonComponent, Modal, Notice, type App } from "obsidian";
import type { TranslateFn } from "./i18n";
import type { WorkflowMigrationReport, WorkflowMigrationService } from "./workflowMigration";

export class WorkflowMigrationModal extends Modal {
	constructor(
		app: App,
		private readonly service: WorkflowMigrationService,
		private readonly report: WorkflowMigrationReport,
		private readonly onApplied: () => void | Promise<void>,
		private readonly t: TranslateFn
	) {
		super(app);
	}

	override onOpen(): void {
		this.modalEl.addClass("tnw-workflow-migration-modal");
		this.setTitle(this.t("migration.title"));
		this.contentEl.empty();
		this.contentEl.createEl("p", {
			text: this.t("migration.summary", {
				convertible: this.report.candidates.length,
				canonical: this.report.alreadyCanonical.length,
				invalid: this.report.invalid.length,
			}),
		});

		for (const candidate of this.report.candidates) {
			const details = this.contentEl.createEl("details", { cls: "tnw-workflow-migration-file" });
			details.createEl("summary", { text: candidate.path });
			details.createEl("pre", { text: candidate.diff });
		}
		if (this.report.invalid.length > 0) {
			this.contentEl.createEl("h3", { text: this.t("migration.manualAttention") });
			for (const issue of this.report.invalid) {
				const details = this.contentEl.createEl("details", { cls: "tnw-workflow-migration-file" });
				details.createEl("summary", { text: issue.path });
				details.createEl("pre", { text: issue.messages.join("\n") || this.t("migration.unrecognized") });
			}
		}

		const actions = this.contentEl.createDiv({ cls: "tnw-modal-footer-actions" });
		new ButtonComponent(actions).setButtonText(this.t("common.cancel")).onClick(() => this.close());
		const apply = new ButtonComponent(actions)
			.setButtonText(this.t("migration.apply", { count: this.report.candidates.length }))
			.setCta()
			.setDisabled(this.report.candidates.length === 0)
			.onClick(() => {
				apply.setDisabled(true);
				void this.service.apply(this.report)
					.then(async (result) => {
						await this.onApplied();
						new Notice(this.t("migration.completed", {
							count: result.migrated.length,
							path: result.backupPath,
						}));
						this.close();
					})
					.catch((error: unknown) => {
						apply.setDisabled(false);
						new Notice(error instanceof Error ? error.message : String(error));
					});
			});
	}
}
