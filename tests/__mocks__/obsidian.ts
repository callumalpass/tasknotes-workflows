export class Notice {
	constructor(public message: string) {}
}

export class TFile {
	path = "";
	name = "";
	basename = "";
	extension = "md";
}

export class Plugin {}

export class ItemView {}

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

