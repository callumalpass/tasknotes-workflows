import { describe, expect, it, vi } from "vitest";
import type {
	MdbaseRuntimeHostApi,
	MdbaseRuntimeProvider,
} from "@callumalpass/mdbase-runtime";
import { TaskNotesBridge } from "../src/tasknotesBridge";

function runtimeHost(label: string): {
	host: MdbaseRuntimeHostApi;
	registerProvider: ReturnType<typeof vi.fn>;
} {
	const registerProvider = vi.fn(async () => ({ providerId: label, unregister: async () => undefined }));
	return { host: {
		profileVersion: "0.1.0",
		registerProvider,
		providers: () => [],
		contracts: () => [],
		policy: () => ({ id: label, selected: true, capabilities: {} }),
		preflight: vi.fn(() => ({ valid: true, diagnostics: [] })),
		subscribe: vi.fn(() => ({ dispose: () => undefined })),
		dispatch: vi.fn(async () => label),
		dispose: async () => undefined,
	}, registerProvider };
}

const provider = {
	descriptor: () => ({
		type: "provider",
		id: "workflows",
		version: 1,
		name: "Workflows",
		provider_version: "0.1.1",
		contracts: {},
	}),
	contracts: () => [],
	readiness: () => ({ valid: true, status: "ready", diagnostics: [] }),
	subscribe: () => ({ dispose: () => undefined }),
	dispatch: async () => undefined,
	dispose: () => undefined,
} satisfies MdbaseRuntimeProvider;

describe("TaskNotesBridge runtime ownership", () => {
	it("uses the selected mdbase-obsidian host", async () => {
		const selected = runtimeHost("mdbase");
		const app = {
			plugins: {
				getPlugin: (id: string) => id === "mdbase-obsidian"
					? { api: { apiVersion: 1, runtime: selected.host } }
					: null,
			},
		};
		const bridge = new TaskNotesBridge(app as never);

		bridge.registerRuntimeProvider(provider);
		await Promise.resolve();

		expect(selected.registerProvider).toHaveBeenCalledWith(provider);
		expect(bridge.preflight({ actions: ["workflow.run"] })).toEqual({ valid: true, diagnostics: [] });
	});

	it("does not use TaskNotes as a generic runtime service locator", () => {
		const tasknotesHost = runtimeHost("tasknotes");
		const app = {
			plugins: {
				getPlugin: (id: string) => id === "tasknotes"
					? { api: { apiVersion: 1, runtime: tasknotesHost.host } }
					: null,
			},
		};
		const bridge = new TaskNotesBridge(app as never);

		expect(bridge.runtimeHost).toBeNull();
		expect(tasknotesHost.registerProvider).not.toHaveBeenCalled();
	});
});
