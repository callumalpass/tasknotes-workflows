import { describe, expect, it, vi } from "vitest";
import { InMemoryInteropBridge } from "@callumalpass/mdbase-interop";
import { TaskNotesBridge } from "../src/tasknotesBridge";
import { WORKFLOW_RUN_CONTRACT } from "../src/interopProvider";

describe("published mdbase-sync integration", () => {
	it("uses mdbase-sync API v1/profile 0.1 with an actual bridge", async () => {
		const bridge = new InMemoryInteropBridge({ authorize: () => true });
		const client = bridge.connect({ application: "tasknotes-workflows", implementation: "test", version: "1.0.0" });
		const provider = bridge.connect({ application: "provider", implementation: "test", version: "1.0.0" });
		await provider.registerActionProvider({ declaration_id: "actions", handlers: [{ handler_id: "run", contract: WORKFLOW_RUN_CONTRACT, handler: () => ({ done: true }) }] });
		const getPlugin = vi.fn((id) => id === "mdbase-sync" ? { api: { apiVersion: 1, interop: { profileVersion: "0.1", connect: () => client, describe: () => bridge.describe() }, getInteropStatus: () => ({ enabled: true }) } } : null);
		const pluginBridge = new TaskNotesBridge({ plugins: { getPlugin } } as never, {} as never);
		expect(pluginBridge.interopAvailable).toBe(true);
		expect((await pluginBridge.invokeContractAction({ contract: { id: WORKFLOW_RUN_CONTRACT.id, version: "1.0.0" }, input: { workflow_id: "test" } })).status).toBe("succeeded");
		expect(getPlugin).toHaveBeenCalledWith("mdbase-sync");
		expect(getPlugin).not.toHaveBeenCalledWith("mdbase-obsidian");
		await pluginBridge.disposeInterop(); await bridge.dispose();
	});
	it.each([[2, "0.1", true], [1, "0.2", true], [1, "0.1", false]])("rejects incompatible or disabled integration %s/%s/%s", (apiVersion, profileVersion, enabled) => {
		const getPlugin = () => ({ api: { apiVersion, interop: { profileVersion }, getInteropStatus: () => ({ enabled }) } });
		expect(new TaskNotesBridge({ plugins: { getPlugin } } as never, {} as never).interopAvailable).toBe(false);
	});
});
