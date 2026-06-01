import { ButtonComponent, Notice } from "obsidian";
import type TaskNotesWorkflowsPlugin from "../main";
import type { LoadedWorkflow, WorkflowStep, WorkflowTrigger } from "./types";
import { RunHistoryModal } from "./runHistoryModal";
import { loadedWorkflowStatus } from "./workflowParser";
import { WorkflowEditModal } from "./workflowEditModal";

export interface WorkflowCardOptions {
	compact?: boolean;
	showPath?: boolean;
	showOpenNote?: boolean;
}

export function renderWorkflowCard(
	parent: HTMLElement,
	plugin: TaskNotesWorkflowsPlugin,
	loaded: LoadedWorkflow,
	options: WorkflowCardOptions = {}
): HTMLElement {
	const workflow = loaded.workflow;
	const card = parent.createDiv({ cls: "tnw-workflow-card" });
	card.toggleClass("is-compact", options.compact === true);
	card.setAttr("data-workflow-path", loaded.file.path);
	if (workflow) card.setAttr("data-workflow-id", workflow.id);

	const header = card.createDiv({ cls: "tnw-card-header" });
	const title = header.createDiv({ cls: "tnw-card-title-block" });
	title.createDiv({ cls: "tnw-card-title", text: workflow?.name ?? loaded.file.basename });
	if (options.showPath !== false) {
		title.createDiv({ cls: "tnw-card-path", text: loaded.file.path });
	}

	const chips = header.createDiv({ cls: "tnw-card-chips" });
	renderChip(chips, displayWorkflowStatus(plugin, loadedWorkflowStatus(loaded)), loadedWorkflowStatus(loaded));
	if (loaded.lastRun) {
		renderChip(chips, plugin.t(`common.runStatus.${loaded.lastRun.status}`), loaded.lastRun.status);
	}
	if (workflow?.run.noOverlap) {
		renderChip(chips, plugin.t("workflowCard.labels.noOverlap"));
	}

	if (workflow?.description && !options.compact) {
		card.createDiv({ cls: "tnw-card-description", text: workflow.description });
	}

	if (loaded.diagnostics.length > 0) {
		const diagnostics = card.createDiv({ cls: "tnw-card-diagnostics" });
		for (const diagnostic of loaded.diagnostics.slice(0, 3)) {
			diagnostics.createDiv({
				cls: `tnw-card-diagnostic is-${diagnostic.severity}`,
				text: `${diagnostic.path}: ${diagnostic.message}`,
			});
		}
	}

	if (workflow) {
		const details = card.createDiv({ cls: "tnw-card-details" });
		renderDetail(details, plugin.t("workflowCard.labels.triggers"), summarizeTriggers(plugin, workflow.triggers));
		renderDetail(details, plugin.t("workflowCard.labels.steps"), summarizeSteps(workflow.steps));
		if (loaded.lastRun) {
			renderDetail(
				details,
				plugin.t("workflowCard.labels.lastRun"),
				`${plugin.t(`common.runStatus.${loaded.lastRun.status}`)} / ${loaded.lastRun.ts}`
			);
		}
	}

	const actions = card.createDiv({ cls: "tnw-card-actions" });
	new ButtonComponent(actions)
		.setIcon("pencil")
		.setTooltip(plugin.t("workflowCard.tooltips.edit"))
		.onClick(() => {
			new WorkflowEditModal(plugin.app, plugin, { loaded }).open();
		});
	new ButtonComponent(actions)
		.setIcon("flask-conical")
		.setTooltip(plugin.t("workflowCard.tooltips.dryRun"))
		.setDisabled(!workflow)
		.onClick(() => runWorkflow(plugin, workflow?.id, true));
	new ButtonComponent(actions)
		.setIcon("play")
		.setTooltip(plugin.t("workflowCard.tooltips.run"))
		.setDisabled(!workflow)
		.onClick(() => runWorkflow(plugin, workflow?.id, false));
	new ButtonComponent(actions)
		.setIcon("history")
		.setTooltip(plugin.t("workflowCard.tooltips.history"))
		.setDisabled(!workflow)
		.onClick(() => {
			new RunHistoryModal(plugin.app, plugin, loaded).open();
		});

	if (options.showOpenNote !== false) {
		new ButtonComponent(actions)
			.setIcon("file-text")
			.setTooltip(plugin.t("workflowCard.tooltips.openNote"))
			.onClick(() => {
				void plugin.openWorkflowFile(loaded.file);
			});
	}

	return card;
}

function renderChip(parent: HTMLElement, label: string, statusClass = label): void {
	parent.createSpan({ cls: `tnw-chip is-${cssClass(statusClass)}`, text: label });
}

function renderDetail(parent: HTMLElement, label: string, value: string): void {
	const detail = parent.createDiv({ cls: "tnw-card-detail" });
	detail.createSpan({ cls: "tnw-card-detail-label", text: label });
	detail.createSpan({ cls: "tnw-card-detail-value", text: value });
}

function summarizeTriggers(plugin: TaskNotesWorkflowsPlugin, triggers: WorkflowTrigger[]): string {
	return triggers
		.map((trigger) => {
			if (trigger.type === "tasknotes.event") {
				return plugin.t("workflowCard.summary.tasknotesEvent", {
					event: trigger.event,
					to: trigger.to
						? plugin.t("workflowCard.summary.tasknotesTo", { value: stringifyScalar(trigger.to) })
						: "",
				});
			}
			if (trigger.type === "cron") return plugin.t("workflowCard.summary.cron", { schedule: trigger.schedule });
			if (trigger.type === "interval") return plugin.t("workflowCard.summary.interval", { every: trigger.every });
			if (trigger.type === "obsidian.vault") return plugin.t("workflowCard.summary.vault", { event: trigger.event });
			if (trigger.type === "obsidian.metadata") return plugin.t("workflowCard.summary.metadata", { event: trigger.event });
			if (trigger.type === "obsidian.workspace") return plugin.t("workflowCard.summary.workspace", { event: trigger.event });
			return plugin.t("workflowCard.summary.manual");
		})
		.join(", ");
}

function summarizeSteps(steps: WorkflowStep[]): string {
	return steps.map((step) => step.type).join(", ");
}

function runWorkflow(plugin: TaskNotesWorkflowsPlugin, workflowId: string | undefined, dryRun: boolean): void {
	if (!workflowId) return;
	void plugin
		.runWorkflowById(workflowId, { dryRun })
		.then((run) =>
			new Notice(
				plugin.t(dryRun ? "notices.workflowDryRunCompleted" : "notices.workflowRunCompleted", {
					status: plugin.t(`common.runStatus.${run.status}`),
					name: run.workflowName,
				})
			)
		)
		.catch((error) => new Notice(error instanceof Error ? error.message : String(error)));
}

function displayWorkflowStatus(plugin: TaskNotesWorkflowsPlugin, status: string): string {
	const translated = plugin.t(`common.workflowStatus.${status}`);
	return translated === `common.workflowStatus.${status}` ? status : translated;
}

function cssClass(value: string): string {
	return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/gu, "-");
}

function stringifyScalar(value: unknown): string {
	if (value === null || typeof value === "undefined") return "";
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
		return String(value);
	}
	return JSON.stringify(value);
}
