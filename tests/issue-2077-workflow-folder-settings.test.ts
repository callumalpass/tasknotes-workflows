import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../src/settings";
import type { TaskNotesWorkflowsSettings } from "../src/types";

type WorkflowsSettingsTabConstructor = typeof import("../src/settingsTab").WorkflowsSettingsTab;

const textComponents: MockTextComponent[] = [];

class MockContainer {
	readonly classNames = new Set<string>();
	isConnected = true;

	empty(): void {}

	addClass(className: string): void {
		this.classNames.add(className);
	}
}

class MockInputElement {
	value = "";
	private readonly listeners = new Map<string, Array<(event: MockEvent) => void>>();

	addEventListener(name: string, callback: (event: MockEvent) => void): void {
		const listeners = this.listeners.get(name) ?? [];
		listeners.push(callback);
		this.listeners.set(name, listeners);
	}

	blur(): void {
		this.dispatch("blur");
	}

	pressEnter(): void {
		this.dispatch("keydown", {
			key: "Enter",
			preventDefault: vi.fn(),
		});
	}

	private dispatch(name: string, event: MockEvent = {}): void {
		for (const listener of this.listeners.get(name) ?? []) {
			listener(event);
		}
	}
}

class MockTextComponent {
	readonly inputEl = new MockInputElement();
	private onChangeCallback: ((value: string) => void) | null = null;

	setValue(value: string): this {
		this.inputEl.value = value;
		return this;
	}

	getValue(): string {
		return this.inputEl.value;
	}

	onChange(callback: (value: string) => void): this {
		this.onChangeCallback = callback;
		return this;
	}

	type(value: string): void {
		this.inputEl.value = value;
		this.onChangeCallback?.(value);
	}
}

class MockToggleComponent {
	setValue(): this {
		return this;
	}

	onChange(): this {
		return this;
	}
}

class MockButtonComponent {
	setButtonText(): this {
		return this;
	}

	setCta(): this {
		return this;
	}

	onClick(): this {
		return this;
	}
}

class MockDropdownComponent {
	addOption(): this {
		return this;
	}

	setValue(): this {
		return this;
	}

	onChange(): this {
		return this;
	}
}

type MockEvent = {
	key?: string;
	preventDefault?: () => void;
};

describe("issue #2077 - workflow folder setting input", () => {
	let WorkflowsSettingsTab: WorkflowsSettingsTabConstructor;

	beforeEach(async () => {
		vi.resetModules();
		textComponents.length = 0;
		vi.doMock("obsidian", () => ({
			Notice: class Notice {},
			PluginSettingTab: class PluginSettingTab {
				readonly containerEl = new MockContainer();
			},
			Setting: class Setting {
				constructor(readonly containerEl: MockContainer) {}

				setName(): this {
					return this;
				}

				setDesc(): this {
					return this;
				}

				setHeading(): this {
					return this;
				}

				addText(callback: (text: MockTextComponent) => void): this {
					const text = new MockTextComponent();
					textComponents.push(text);
					callback(text);
					return this;
				}

				addToggle(callback: (toggle: MockToggleComponent) => void): this {
					callback(new MockToggleComponent());
					return this;
				}

				addButton(callback: (button: MockButtonComponent) => void): this {
					callback(new MockButtonComponent());
					return this;
				}

				addDropdown(callback: (dropdown: MockDropdownComponent) => void): this {
					callback(new MockDropdownComponent());
					return this;
				}
			},
		}));
		({ WorkflowsSettingsTab } = await import("../src/settingsTab"));
	});

	it("does not save and reload the workflow folder while the user is still typing", () => {
		const plugin = mockPlugin();
		const tab = new WorkflowsSettingsTab({} as never, plugin as never);
		expect(tab).toBeDefined();

		plugin.triggerLocaleChange();
		const workflowFolderText = textComponents[0];
		workflowFolderText.type("W");
		workflowFolderText.type("Work");
		workflowFolderText.type("Workflows/New");

		expect(plugin.settings.workflowFolder).toBe(DEFAULT_SETTINGS.workflowFolder);
		expect(plugin.saveSettingsAndReload).not.toHaveBeenCalled();

		workflowFolderText.inputEl.blur();

		expect(plugin.settings.workflowFolder).toBe("Workflows/New");
		expect(plugin.saveSettingsAndReload).toHaveBeenCalledTimes(1);
	});
});

function mockPlugin(): MockPlugin {
	const localeCallbacks: Array<() => void> = [];
	return {
		settings: { ...DEFAULT_SETTINGS },
		i18n: {
			on: vi.fn((_name: string, callback: () => void) => {
				localeCallbacks.push(callback);
				return { name: "locale-changed" };
			}),
			getAvailableLocales: vi.fn(() => []),
			getNativeLanguageName: vi.fn((code: string) => code),
		},
		triggerLocaleChange: () => {
			for (const callback of localeCallbacks) callback();
		},
		registerEvent: vi.fn(),
		t: vi.fn((key: string) => key),
		saveSettings: vi.fn(async () => {}),
		saveSettingsAndReload: vi.fn(async () => {}),
		ensureDefaultFiles: vi.fn(async () => ({ workflows: [], view: null })),
		showDefaultFilesNotice: vi.fn(),
		clearRunHistory: vi.fn(async () => {}),
	};
}

type MockPlugin = {
	settings: TaskNotesWorkflowsSettings;
	i18n: {
		on: ReturnType<typeof vi.fn>;
		getAvailableLocales: ReturnType<typeof vi.fn>;
		getNativeLanguageName: ReturnType<typeof vi.fn>;
	};
	triggerLocaleChange: () => void;
	registerEvent: ReturnType<typeof vi.fn>;
	t: ReturnType<typeof vi.fn>;
	saveSettings: ReturnType<typeof vi.fn>;
	saveSettingsAndReload: ReturnType<typeof vi.fn>;
	ensureDefaultFiles: ReturnType<typeof vi.fn>;
	showDefaultFilesNotice: ReturnType<typeof vi.fn>;
	clearRunHistory: ReturnType<typeof vi.fn>;
};
