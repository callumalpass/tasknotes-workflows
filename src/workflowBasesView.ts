import { ButtonComponent, Component, type App } from "obsidian";
import type { BasesView, BasesViewFactory } from "obsidian";
import type TaskNotesWorkflowsPlugin from "../main";
import { WORKFLOW_BASE_VIEW_TYPE } from "./constants";
import { renderWorkflowCard } from "./workflowCard";
import { WorkflowEditModal } from "./workflowEditModal";

export class WorkflowBasesView extends Component {
	type = WORKFLOW_BASE_VIEW_TYPE;
	app!: App;
	private rootEl: HTMLElement | null = null;

	constructor(
		_controller: unknown,
		private readonly containerEl: HTMLElement,
		private readonly plugin: TaskNotesWorkflowsPlugin
	) {
		super();
	}

	override onload(): void {
		this.plugin.registerWorkflowBaseView(this);
		void this.render();
	}

	override onunload(): void {
		this.plugin.unregisterWorkflowBaseView(this);
		this.containerEl.empty();
	}

	onDataUpdated(): void {
		void this.render();
	}

	onResize(): void {
		// Bases calls this lifecycle hook when its container changes size.
	}

	focus(): void {
		this.rootEl?.focus({ preventScroll: true });
	}

	getEphemeralState(): unknown {
		return {
			scrollTop: this.rootEl?.scrollTop ?? 0,
		};
	}

	setEphemeralState(state: unknown): void {
		if (!isScrollState(state)) return;
		if (typeof state.scrollTop === "number" && this.rootEl) {
			this.rootEl.scrollTop = state.scrollTop;
		}
	}

	getViewActions(): unknown[] {
		return [];
	}

	async createFileForView(): Promise<void> {
		new WorkflowEditModal(this.plugin.app, this.plugin).open();
	}

	async render(): Promise<void> {
		this.containerEl.empty();
		this.containerEl.addClass("tnw-bases-view");
		this.rootEl = this.containerEl.createDiv({ cls: "tnw-base-shell" });
		this.rootEl.tabIndex = -1;
		this.renderHeader(this.rootEl);
		this.renderCards(this.rootEl);
	}

	private renderHeader(parent: HTMLElement): void {
		const header = parent.createDiv({ cls: "tnw-base-header" });
		const title = header.createDiv({ cls: "tnw-title-block" });
		title.createEl("h2", { text: this.plugin.t("baseView.title") });
		title.createDiv({
			cls: "tnw-subtitle",
			text: this.plugin.tasknotesAvailable
				? this.plugin.t("baseView.tasknotesAvailable")
				: this.plugin.t("baseView.tasknotesUnavailable"),
		});
	}

	private renderCards(parent: HTMLElement): void {
		const existing = parent.querySelector(".tnw-base-cards");
		existing?.remove();
		const cards = parent.createDiv({ cls: "tnw-base-cards" });
		const workflows = this.plugin.workflows;
		if (workflows.length === 0) {
			const empty = cards.createDiv({ cls: "tnw-empty" });
			empty.createDiv({ cls: "tnw-empty-title", text: this.plugin.t("baseView.empty") });
			const actions = empty.createDiv({ cls: "tnw-form-actions" });
			new ButtonComponent(actions)
				.setIcon("plus")
				.setButtonText(this.plugin.t("baseView.newWorkflow"))
				.setCta()
				.onClick(() => {
					new WorkflowEditModal(this.plugin.app, this.plugin).open();
				});
			return;
		}

		for (const workflow of workflows) {
			renderWorkflowCard(cards, this.plugin, workflow, { showPath: true });
		}
	}
}

function isScrollState(value: unknown): value is { scrollTop?: number } {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function buildWorkflowBasesViewFactory(plugin: TaskNotesWorkflowsPlugin): BasesViewFactory {
	return function (controller: unknown, containerEl: HTMLElement): BasesView {
		return new WorkflowBasesView(controller, containerEl, plugin) as unknown as BasesView;
	};
}
