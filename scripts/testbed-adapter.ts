import {
	InMemoryInteropBridge,
	InteropError,
	contractDigest,
	type ActionOutcome,
} from "@callumalpass/mdbase-interop";
import {
	createWorkflowsActionProvider,
	WORKFLOW_RUN_CONTRACT,
} from "../src/interopProvider";

const SCENARIO = "interop.application-provider-lifecycle";
const implementation = {
	id: "tasknotes-workflows",
	name: "TaskNotes Workflows Obsidian plugin",
	version: "0.1.2",
	language: "TypeScript",
	target: "Obsidian",
};

const command = process.argv[2];
if (command === "describe") {
	write({
		kind: "mdbase.testbed.adapter",
		protocol_version: "0.1",
		implementation,
		profiles: ["event_action_interop/0.1"],
		roles: ["action_provider"],
		scenarios: [SCENARIO],
	});
} else if (command === "run") {
	try {
		const request = JSON.parse(await readStdin()) as {
			kind?: string;
			protocol_version?: string;
			scenario?: { id?: string };
		};
		if (
			request.kind !== "mdbase.testbed.run"
			|| request.protocol_version !== "0.1"
			|| request.scenario?.id !== SCENARIO
		) {
			throw new Error("Unsupported or invalid mdbase testbed run request.");
		}
		write({
			kind: "mdbase.testbed.transcript",
			protocol_version: "0.1",
			scenario_id: SCENARIO,
			implementation,
			entries: await providerLifecycle(),
		});
	} catch (error) {
		process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
		process.exitCode = 1;
	}
} else {
	process.stderr.write("Usage: testbed-adapter.mjs describe|run\n");
	process.exitCode = 2;
}

async function providerLifecycle(): Promise<Record<string, unknown>[]> {
	let nextId = 0;
	const bridge = new InMemoryInteropBridge({
		authorize: () => true,
		now: () => new Date("2026-07-29T00:00:00.000Z"),
		idFactory: (prefix) => `${prefix}_${++nextId}`,
	});
	try {
		let providerCalls = 0;
		const application = bridge.connect(identity("tasknotes-workflows"));
		const caller = bridge.connect(identity("caller"));
		await application.registerActionProvider(createWorkflowsActionProvider({
			runWorkflow: async () => {
				providerCalls += 1;
				return { status: "success" } as never;
			},
		}));
		const validInput = { workflow_id: "daily-review", dry_run: true };
		const outcome = await caller.invokeAction({
			request_id: "req-workflow-1",
			contract: {
				id: WORKFLOW_RUN_CONTRACT.id,
				version: WORKFLOW_RUN_CONTRACT.version,
			},
			idempotency_key: "testbed:daily-review",
			input: validInput,
		});
		const invalidCode = await rejectedCode(() => caller.invokeAction({
			request_id: "req-workflow-invalid",
			contract: {
				id: WORKFLOW_RUN_CONTRACT.id,
				version: WORKFLOW_RUN_CONTRACT.version,
			},
			idempotency_key: "testbed:invalid",
			input: {},
		}));
		await application.dispose();
		const missingCode = await rejectedCode(() => caller.invokeAction({
			request_id: "req-workflow-unloaded",
			contract: {
				id: WORKFLOW_RUN_CONTRACT.id,
				version: WORKFLOW_RUN_CONTRACT.version,
			},
			idempotency_key: "testbed:unloaded",
			input: validInput,
		}));

		return [
			entry(1, "arrange", "application", "contract.describe", "succeeded", {
				contract_type: WORKFLOW_RUN_CONTRACT.contract_type,
				schema: WORKFLOW_RUN_CONTRACT.input_schema.dialect,
			}),
			entry(2, "arrange", "application", "action-provider.register", "succeeded", {
				providers: 1,
			}),
			entry(3, "act", "caller", "action.invoke", "succeeded", {
				exact_contract: await exactContract(outcome),
				provider_calls: providerCalls,
			}),
			entry(4, "act", "caller", "action.invoke", "rejected", {
				code: invalidCode,
			}),
			entry(5, "act", "application", "client.dispose", "succeeded", {
				providers: bridge.describe().action_providers.length,
			}),
			entry(6, "observe", "caller", "action.invoke", "rejected", {
				code: missingCode,
			}),
		];
	} finally {
		await bridge.dispose();
	}
}

async function exactContract(outcome: ActionOutcome): Promise<boolean> {
	return outcome.contract.id === WORKFLOW_RUN_CONTRACT.id
		&& outcome.contract.version === WORKFLOW_RUN_CONTRACT.version
		&& outcome.contract.digest === await contractDigest(WORKFLOW_RUN_CONTRACT);
}

async function rejectedCode(operation: () => Promise<unknown>): Promise<string> {
	try {
		await operation();
	} catch (error) {
		if (error instanceof InteropError) return error.code;
		throw error;
	}
	throw new Error("Expected interoperability operation to reject.");
}

function identity(application: string) {
	return {
		application,
		implementation: `${application}.testbed`,
		version: "1.0.0",
		instance_id: `${application}-instance`,
	};
}

function entry(
	sequence: number,
	phase: string,
	actor: string,
	operation: string,
	outcome: string,
	facts: Record<string, unknown>,
) {
	return { sequence, phase, actor, operation, outcome, facts };
}

async function readStdin(): Promise<string> {
	let source = "";
	for await (const chunk of process.stdin) source += chunk;
	return source;
}

function write(value: unknown): void {
	process.stdout.write(`${JSON.stringify(value)}\n`);
}
