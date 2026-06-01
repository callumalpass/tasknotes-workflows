export class Notice {
	constructor(public message: string) {}
}

type EventCallback = (...args: unknown[]) => void;

export class Events {
	private callbacks = new Map<string, EventCallback[]>();

	on(name: string, callback: EventCallback): { name: string; callback: EventCallback } {
		const callbacks = this.callbacks.get(name) ?? [];
		callbacks.push(callback);
		this.callbacks.set(name, callbacks);
		return { name, callback };
	}

	offref(ref: { name: string; callback: EventCallback }): void {
		const callbacks = this.callbacks.get(ref.name) ?? [];
		this.callbacks.set(
			ref.name,
			callbacks.filter((callback) => callback !== ref.callback)
		);
	}

	trigger(name: string, ...args: unknown[]): void {
		for (const callback of this.callbacks.get(name) ?? []) {
			callback(...args);
		}
	}
}

export class TFile {
	path = "";
	name = "";
	basename = "";
	extension = "md";
}

export class Plugin {}

export class ItemView {}

export function getLanguage(): string {
	return "en";
}

export class ButtonComponent {
	setIcon(): this {
		return this;
	}
	setTooltip(): this {
		return this;
	}
	setButtonText(): this {
		return this;
	}
	setCta(): this {
		return this;
	}
	setDisabled(): this {
		return this;
	}
	onClick(): this {
		return this;
	}
}

export function normalizePath(path: string): string {
	return path.replace(/\\/gu, "/").replace(/\/+/gu, "/").replace(/\/$/u, "");
}
