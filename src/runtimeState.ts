import type { App } from "obsidian";

export const RESERVATION_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
interface RuntimeState {
	reservations: Record<string, number>;
	lastFire: Record<string, number>;
	lastAdmission: Record<string, number>;
}

/** One serialized state file, independent of history retention and data.json. */
export class RuntimeStateStore {
	private state: RuntimeState = { reservations: {}, lastFire: {}, lastAdmission: {} };
	private queue: Promise<unknown> = Promise.resolve();
	private loaded = false;
	constructor(private readonly app: App | null = null) {}

	update<T>(operation: (state: RuntimeState) => T): Promise<T> {
		const result = this.queue.then(async () => {
			const path = `${this.app?.vault.configDir}/plugins/tasknotes-workflows/runtime-state.json`;
			if (!this.loaded) {
				if (this.app && await this.app.vault.adapter.exists(path)) {
					this.state = JSON.parse(await this.app.vault.adapter.read(path)) as RuntimeState;
				}
				this.loaded = true;
			}
			const next = structuredClone(this.state);
			const value = operation(next);
			if (this.app) await this.app.vault.adapter.write(path, JSON.stringify(next));
			this.state = next;
			return value;
		});
		this.queue = result.catch(() => undefined);
		return result;
	}

	reserve(key: string, now = Date.now(), trigger?: { key: string; minimumIntervalMs: number }): Promise<boolean> {
		return this.update((state) => {
			for (const [candidate, expires] of Object.entries(state.reservations)) {
				if (expires <= now) delete state.reservations[candidate];
			}
			if (Object.prototype.hasOwnProperty.call(state.reservations, key)) return false;
			if (trigger) {
				const last = state.lastAdmission[trigger.key];
				if (last !== undefined && now - last < trigger.minimumIntervalMs) return false;
				state.lastAdmission[trigger.key] = now;
			}
			Object.defineProperty(state.reservations, key, { value: now + RESERVATION_RETENTION_MS, enumerable: true, configurable: true, writable: true });
			return true;
		});
	}
}
