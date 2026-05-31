import type { Extension } from "@codemirror/state";
import { EditorView, ViewPlugin } from "@codemirror/view";
import type { PluginValue, ViewUpdate } from "@codemirror/view";
import { MarkdownView, TFile, editorInfoField, type WorkspaceLeaf } from "obsidian";
import type TaskNotesWorkflowsPlugin from "../main";
import { WORKFLOW_TYPE } from "./constants";
import { renderWorkflowCard } from "./workflowCard";
import type { LoadedWorkflow } from "./types";

const NOTE_CARD_HOST_CLASS = "tnw-note-card-host";
const NOTE_CARD_SELECTOR = `.${NOTE_CARD_HOST_CLASS}`;

const editorInstances = new Set<WorkflowNoteCardEditorPlugin>();

export function registerWorkflowNoteCards(plugin: TaskNotesWorkflowsPlugin): void {
	plugin.registerEditorExtension(createWorkflowNoteCardEditorExtension(plugin));

	const scheduleAllReadingModeCards = debounce(() => {
		void refreshReadingModeWorkflowCards(plugin);
	}, 100);

	plugin.registerMarkdownPostProcessor((_el, ctx) => {
		if (!isWorkflowFrontmatter(ctx.frontmatter)) return;
		scheduleReadingModeWorkflowCards(plugin, ctx.sourcePath);
	}, -10);

	plugin.registerEvent(plugin.app.workspace.on("layout-change", scheduleAllReadingModeCards));
	plugin.registerEvent(
		plugin.app.workspace.on("active-leaf-change", (leaf) => {
			if (leaf) void injectReadingModeWorkflowCard(plugin, leaf);
			refreshWorkflowNoteCards(plugin);
		})
	);
	plugin.registerEvent(
		plugin.app.metadataCache.on("changed", (file) => {
			scheduleReadingModeWorkflowCards(plugin, file.path);
			refreshWorkflowNoteCards(plugin, file.path);
		})
	);

	window.setTimeout(() => {
		refreshWorkflowNoteCards(plugin);
	}, 0);
}

export function refreshWorkflowNoteCards(plugin: TaskNotesWorkflowsPlugin, path?: string): void {
	for (const instance of editorInstances) {
		if (!path || instance.filePath === path) {
			instance.refresh();
		}
	}
	void refreshReadingModeWorkflowCards(plugin, path);
}

class WorkflowNoteCardEditorPlugin implements PluginValue {
	private currentHost: HTMLElement | null = null;
	private currentFilePath: string | null = null;

	constructor(
		private view: EditorView,
		private readonly plugin: TaskNotesWorkflowsPlugin
	) {
		editorInstances.add(this);
		this.refresh();
	}

	get filePath(): string | null {
		return this.currentFilePath;
	}

	update(update: ViewUpdate): void {
		this.view = update.view;
		const nextPath = getEditorFilePath(update.view);
		if (nextPath !== this.currentFilePath || update.docChanged) {
			this.refresh();
		}
	}

	destroy(): void {
		editorInstances.delete(this);
		this.removeHost();
	}

	refresh(): void {
		const path = getEditorFilePath(this.view);
		this.currentFilePath = path;
		this.removeHost();

		if (!path || shouldSkipEditor(this.view)) return;

		const loaded = this.plugin.workflows.find((workflow) => workflow.file.path === path);
		if (!loaded) return;

		const container = this.view.dom
			.closest(".markdown-source-view")
			?.querySelector<HTMLElement>(".cm-sizer");
		if (!container) return;

		removeWorkflowNoteCardHosts(container);
		const host = createWorkflowNoteCardHost(this.plugin, loaded, "editor");
		this.currentHost = host;
		insertAfterMetadataOrHeader(container, host);
	}

	private removeHost(): void {
		this.currentHost?.remove();
		this.currentHost = null;
	}
}

function createWorkflowNoteCardEditorExtension(plugin: TaskNotesWorkflowsPlugin): Extension {
	return ViewPlugin.fromClass(
		class extends WorkflowNoteCardEditorPlugin {
			constructor(view: EditorView) {
				super(view, plugin);
			}
		}
	);
}

function scheduleReadingModeWorkflowCards(plugin: TaskNotesWorkflowsPlugin, path?: string): void {
	window.setTimeout(() => {
		void refreshReadingModeWorkflowCards(plugin, path);
	}, 0);
}

async function refreshReadingModeWorkflowCards(
	plugin: TaskNotesWorkflowsPlugin,
	path?: string
): Promise<void> {
	for (const leaf of plugin.app.workspace.getLeavesOfType("markdown")) {
		const view = leaf.view;
		if (!(view instanceof MarkdownView)) continue;
		if (path && view.file?.path !== path) continue;
		await injectReadingModeWorkflowCard(plugin, leaf);
	}
}

async function injectReadingModeWorkflowCard(
	plugin: TaskNotesWorkflowsPlugin,
	leaf: WorkspaceLeaf
): Promise<void> {
	const view = leaf.view;
	if (!(view instanceof MarkdownView)) return;

	removeWorkflowNoteCardHosts(view.previewMode.containerEl);
	if (view.getMode() !== "preview") return;
	if (shouldSkipLeaf(leaf)) return;

	const file = view.file;
	if (!file) return;

	const container = view.previewMode.containerEl;
	const loaded = await loadWorkflow(plugin, file);
	if (!loaded) return;

	const sizer = container.querySelector<HTMLElement>(".markdown-preview-sizer");
	if (!sizer) return;

	const host = createWorkflowNoteCardHost(plugin, loaded, "reading");
	insertAfterMetadataOrHeader(sizer, host);
}

async function loadWorkflow(
	plugin: TaskNotesWorkflowsPlugin,
	file: TFile
): Promise<LoadedWorkflow | null> {
	const cached = plugin.workflows.find((workflow) => workflow.file.path === file.path);
	if (cached) return cached;

	const metadata = plugin.app.metadataCache.getFileCache(file);
	if (!isWorkflowFrontmatter(metadata?.frontmatter)) return null;
	return await plugin.repository.loadFile(file);
}

function createWorkflowNoteCardHost(
	plugin: TaskNotesWorkflowsPlugin,
	loaded: LoadedWorkflow,
	context: "editor" | "reading"
): HTMLElement {
	const host = activeDocument.createElement("div");
	host.className = NOTE_CARD_HOST_CLASS;
	host.setAttribute("contenteditable", "false");
	host.setAttribute("spellcheck", "false");
	host.setAttribute("data-workflow-note-card", context);
	host.setAttribute("data-workflow-path", loaded.file.path);
	renderWorkflowCard(host, plugin, loaded, {
		compact: true,
		showPath: false,
		showOpenNote: false,
	});
	return host;
}

function removeWorkflowNoteCardHosts(container: ParentNode): void {
	container.querySelectorAll(NOTE_CARD_SELECTOR).forEach((element) => {
		element.remove();
	});
}

function getEditorFilePath(view: EditorView): string | null {
	try {
		const editorInfo = view.state.field(editorInfoField, false);
		return editorInfo?.file instanceof TFile ? editorInfo.file.path : null;
	} catch {
		return null;
	}
}

function shouldSkipEditor(view: EditorView): boolean {
	const editorEl = view.dom;
	return Boolean(
		editorEl.closest(
			[
				".internal-embed.markdown-embed",
				".markdown-embed",
				".popover.hover-popover",
				".cm-table-widget",
				"td",
				"th",
			].join(", ")
		)
	);
}

function shouldSkipLeaf(leaf: WorkspaceLeaf): boolean {
	const leafRecord = leaf as { parent?: unknown };
	if ("parent" in leafRecord && leafRecord.parent == null) return true;

	const container = (leaf.view as { containerEl?: HTMLElement } | undefined)?.containerEl;
	return Boolean(container?.closest(".internal-embed.markdown-embed, .markdown-embed, .popover.hover-popover"));
}

function getMetadataOrHeaderInsertionReference(container: HTMLElement): ChildNode | null {
	const metadataContainer = container.querySelector(".metadata-container");
	if (metadataContainer) {
		const anchor = findDirectChildAncestor(container, metadataContainer);
		return anchor?.nextSibling ?? null;
	}

	const header = findDirectHeader(container);
	if (header) return header.nextSibling;

	const previewPusher = findDirectChildWithClass(container, "markdown-preview-pusher");
	if (previewPusher) return previewPusher.nextSibling;

	return container.firstChild;
}

function insertAfterMetadataOrHeader(container: HTMLElement, widget: HTMLElement): void {
	container.insertBefore(widget, getMetadataOrHeaderInsertionReference(container));
}

function findDirectChildAncestor(container: HTMLElement, element: Element): Element | null {
	let current: Element | null = element;

	while (current?.parentElement && current.parentElement !== container) {
		current = current.parentElement;
	}

	return current?.parentElement === container ? current : null;
}

function findDirectHeader(container: HTMLElement): Element | null {
	for (let index = 0; index < container.children.length; index += 1) {
		const child = container.children.item(index);
		if (child?.classList.contains("mod-header") && child.classList.contains("mod-ui")) return child;
	}
	return null;
}

function findDirectChildWithClass(container: HTMLElement, className: string): Element | null {
	for (let index = 0; index < container.children.length; index += 1) {
		const child = container.children.item(index);
		if (child?.classList.contains(className)) return child;
	}
	return null;
}

function debounce(callback: () => void, delayMs: number): () => void {
	let timer: number | null = null;
	return () => {
		if (timer !== null) window.clearTimeout(timer);
		timer = window.setTimeout(() => {
			timer = null;
			callback();
		}, delayMs);
	};
}

function isWorkflowFrontmatter(frontmatter: unknown): boolean {
	return (
		frontmatter !== null &&
		typeof frontmatter === "object" &&
		"type" in frontmatter &&
		(frontmatter as { type?: unknown }).type === WORKFLOW_TYPE
	);
}
