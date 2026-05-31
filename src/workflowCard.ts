import { ButtonComponent, Notice } from "obsidian";
import type TaskNotesWorkflowsPlugin from "../main";
import type { LoadedWorkflow, WorkflowStep, WorkflowTrigger } from "./types";
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
	renderChip(chips, loadedWorkflowStatus(loaded));
	if (loaded.lastRun) {
		renderChip(chips, loaded.lastRun.status);
	}
	if (workflow?.run.noOverlap) {
		renderChip(chips, "no overlap");
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
		renderDetail(details, "Triggers", summarizeTriggers(workflow.triggers));
		renderDetail(details, "Steps", summarizeSteps(workflow.steps));
		if (loaded.lastRun) {
			renderDetail(details, "Last run", `${loaded.lastRun.status} / ${loaded.lastRun.ts}`);
		}
	}

	const actions = card.createDiv({ cls: "tnw-card-actions" });
	new ButtonComponent(actions)
		.setIcon("pencil")
		.setTooltip("Edit workflow")
		.onClick(() => {
			new WorkflowEditModal(plugin.app, plugin, { loaded }).open();
		});
	new ButtonComponent(actions)
		.setIcon("flask-conical")
		.setTooltip("Dry run workflow")
		.setDisabled(!workflow)
		.onClick(() => runWorkflow(plugin, workflow?.id, true));
	new ButtonComponent(actions)
		.setIcon("play")
		.setTooltip("Run workflow")
		.setDisabled(!workflow)
		.onClick(() => runWorkflow(plugin, workflow?.id, false));

	if (options.showOpenNote !== false) {
		new ButtonComponent(actions)
			.setIcon("file-text")
			.setTooltip("Open workflow note")
			.onClick(() => {
				void plugin.openWorkflowFile(loaded.file);
			});
	}

	return card;
}

function renderChip(parent: HTMLElement, status: string): void {
	parent.createSpan({ cls: `tnw-chip is-${cssClass(status)}`, text: status });
}

function renderDetail(parent: HTMLElement, label: string, value: string): void {
	const detail = parent.createDiv({ cls: "tnw-card-detail" });
	detail.createSpan({ cls: "tnw-card-detail-label", text: label });
	detail.createSpan({ cls: "tnw-card-detail-value", text: value });
}

function summarizeTriggers(triggers: WorkflowTrigger[]): string {
	return triggers
		.map((trigger) => {
			if (trigger.type === "tasknotes.event") {
				return `TaskNotes ${trigger.event}${trigger.to ? ` -> ${stringifyScalar(trigger.to)}` : ""}`;
			}
			if (trigger.type === "cron") return `cron ${trigger.schedule}`;
			if (trigger.type === "interval") return `every ${trigger.every}`;
			if (trigger.type === "obsidian.vault") return `vault ${trigger.event}`;
			if (trigger.type === "obsidian.metadata") return `metadata ${trigger.event}`;
			if (trigger.type === "obsidian.workspace") return `workspace ${trigger.event}`;
			return "manual";
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
		.then((run) => new Notice(`${dryRun ? "Dry run" : "Run"} ${run.status}: ${run.workflowName}`))
		.catch((error) => new Notice(error instanceof Error ? error.message : String(error)));
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
