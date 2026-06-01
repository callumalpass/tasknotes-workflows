import { Modal, Notice, type App } from "obsidian";
import type TaskNotesWorkflowsPlugin from "../main";
import type { LoadedWorkflow, RunSummary, StepRunDetail, WorkflowRunDetail } from "./types";

export class RunHistoryModal extends Modal {
	private runs: RunSummary[] = [];
	private activeRunId: string | null = null;
	private activeDetail: WorkflowRunDetail | null = null;
	private loading = true;

	constructor(
		app: App,
		private readonly plugin: TaskNotesWorkflowsPlugin,
		private readonly loaded: LoadedWorkflow
	) {
		super(app);
	}

	override onOpen(): void {
		this.modalEl.addClass("tnw-run-history-modal");
		this.titleEl.setText(this.plugin.t("runHistory.title"));
		this.render();
		void this.load();
	}

	override onClose(): void {
		this.contentEl.empty();
	}

	private async load(): Promise<void> {
		const workflowId = this.loaded.workflow?.id;
		if (!workflowId) {
			this.loading = false;
			this.render();
			return;
		}

		this.loading = true;
		this.render();
		this.runs = await this.plugin.recentRuns(workflowId);
		this.activeRunId = this.runs[0]?.runId ?? null;
		await this.loadDetail(this.activeRunId);
		this.loading = false;
		this.render();
	}

	private async loadDetail(runId: string | null): Promise<void> {
		const workflowId = this.loaded.workflow?.id;
		if (!workflowId || !runId) {
			this.activeDetail = null;
			return;
		}
		this.activeDetail = await this.plugin.readRunDetail(workflowId, runId);
	}

	private render(): void {
		this.contentEl.empty();
		const workflow = this.loaded.workflow;
		const root = this.contentEl.createDiv({ cls: "tnw-run-history" });
		const summary = root.createDiv({ cls: "tnw-run-history-summary" });
		const summaryCopy = summary.createDiv({ cls: "tnw-run-history-summary-copy" });
		summaryCopy.createDiv({ cls: "tnw-run-history-workflow", text: workflow?.name ?? this.loaded.file.basename });
		summaryCopy.createDiv({ cls: "tnw-card-path", text: this.loaded.file.path });
		const summaryMeta = summary.createDiv({ cls: "tnw-summary-strip" });
		renderMeta(summaryMeta, this.plugin.t("runHistory.runs"), String(this.runs.length));
		if (this.runs[0]) renderMeta(summaryMeta, this.plugin.t("runHistory.latest"), formatDateTime(this.runs[0].ts));

		if (!workflow) {
			root.createDiv({ cls: "tnw-empty-state", text: this.plugin.t("runHistory.empty.diagnostics") });
			return;
		}
		if (this.loading) {
			root.createDiv({ cls: "tnw-empty-state", text: this.plugin.t("runHistory.empty.loading") });
			return;
		}
		if (this.runs.length === 0) {
			root.createDiv({ cls: "tnw-empty-state", text: this.plugin.t("runHistory.empty.noRuns") });
			return;
		}

		const shell = root.createDiv({ cls: "tnw-run-history-shell" });
		const list = shell.createDiv({ cls: "tnw-run-list" });
		for (const run of this.runs) {
			this.renderRunListItem(list, run);
		}
		const detail = shell.createDiv({ cls: "tnw-run-detail" });
		this.renderRunDetail(detail);
	}

	private renderRunListItem(parent: HTMLElement, run: RunSummary): void {
		const button = parent.createEl("button", { cls: "tnw-run-list-item" });
		button.setAttr("type", "button");
		button.toggleClass("is-active", run.runId === this.activeRunId);
		button.addEventListener("click", () => {
			this.activeRunId = run.runId;
			void this.loadDetail(run.runId)
				.then(() => this.render())
				.catch((error) => new Notice(error instanceof Error ? error.message : String(error)));
		});

		const top = button.createSpan({ cls: "tnw-run-list-item-top" });
		top.createSpan({ cls: `tnw-chip is-${cssClass(run.status)}`, text: this.plugin.t(`common.runStatus.${run.status}`) });
		top.createSpan({ cls: "tnw-run-time", text: formatDateTime(run.ts) });

		const meta = button.createSpan({ cls: "tnw-run-list-meta" });
		meta.createSpan({ text: run.dryRun ? this.plugin.t("runHistory.dryRun") : run.trigger });
		meta.createSpan({ text: this.plugin.i18n.translatePlural("runHistory.stepCount", run.steps) });
		meta.createSpan({ text: formatDuration(run.durationMs) });
		if (run.error) button.createSpan({ cls: "tnw-run-list-error", text: run.error });
	}

	private renderRunDetail(parent: HTMLElement): void {
		const run = this.runs.find((item) => item.runId === this.activeRunId) ?? this.runs[0];
		if (!run) return;

		const header = parent.createDiv({ cls: "tnw-run-detail-header" });
		const title = header.createDiv({ cls: "tnw-run-detail-title" });
		title.createSpan({ cls: `tnw-chip is-${cssClass(run.status)}`, text: this.plugin.t(`common.runStatus.${run.status}`) });
		title.createSpan({ text: formatDateTime(run.ts) });
		const meta = header.createDiv({ cls: "tnw-summary-strip" });
		renderMeta(meta, this.plugin.t("runHistory.trigger"), run.dryRun ? this.plugin.t("runHistory.dryRun") : run.trigger);
		renderMeta(meta, this.plugin.t("runHistory.duration"), formatDuration(run.durationMs));
		renderMeta(meta, this.plugin.t("runHistory.runId"), shortRunId(run.runId));

		const detail = this.activeDetail;
		if (run.error) {
			parent.createDiv({ cls: "tnw-run-error", text: run.error });
		}
		if (!detail) {
			parent.createDiv({ cls: "tnw-empty-state", text: this.plugin.t("runHistory.empty.missingDetail") });
			return;
		}

		const steps = parent.createDiv({ cls: "tnw-run-steps" });
		for (const [index, step] of detail.steps.entries()) {
			this.renderStepDetail(steps, step, index);
		}
	}

	private renderStepDetail(parent: HTMLElement, step: StepRunDetail, index: number): void {
		const item = parent.createDiv({ cls: "tnw-run-step" });
		const header = item.createDiv({ cls: "tnw-run-step-header" });
		const title = header.createDiv({ cls: "tnw-run-step-title" });
		title.createSpan({ cls: "tnw-step-index", text: String(index + 1) });
		const copy = title.createSpan({ cls: "tnw-card-summary-copy" });
		copy.createSpan({ cls: "tnw-card-summary-title", text: step.id });
		copy.createSpan({ cls: "tnw-card-path", text: step.type });
		header.createSpan({ cls: `tnw-chip is-${cssClass(step.status)}`, text: this.plugin.t(`common.runStatus.${step.status}`) });
		if (typeof step.durationMs === "number") {
			header.createSpan({ cls: "tnw-chip", text: formatDuration(step.durationMs) });
		}
		if (step.error) item.createDiv({ cls: "tnw-run-error", text: step.error });

		const data = item.createDiv({ cls: "tnw-run-step-data" });
		renderJsonDetails(data, this.plugin.t("runHistory.input"), step.input);
		renderJsonDetails(data, this.plugin.t("runHistory.output"), step.output);
	}
}

function renderJsonDetails(parent: HTMLElement, label: string, value: unknown): void {
	if (typeof value === "undefined") return;
	const details = parent.createEl("details", { cls: "tnw-run-json" });
	details.createEl("summary", { text: label });
	details.createEl("pre", { text: JSON.stringify(value, null, 2) });
}

function renderMeta(parent: HTMLElement, label: string, value: string): void {
	const pill = parent.createSpan({ cls: "tnw-summary-pill" });
	pill.createSpan({ cls: "tnw-summary-label", text: label });
	pill.createSpan({ cls: "tnw-summary-value", text: value });
}

function formatDateTime(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function formatDuration(value: number): string {
	if (!Number.isFinite(value)) return "0 ms";
	if (value < 1000) return `${Math.max(0, Math.round(value))} ms`;
	return `${(value / 1000).toFixed(1)} s`;
}

function shortRunId(value: string): string {
	return value.slice(0, 8);
}

function cssClass(value: string): string {
	return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/gu, "-");
}
