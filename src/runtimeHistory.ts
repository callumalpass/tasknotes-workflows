import { portableDigest, type ExactContractReference, type ImplementationIdentity, type ActionOutcome } from "@callumalpass/mdbase-interop";
import type { AdmittedWorkflowPlan } from "@callumalpass/mdbase-runtime";
import type { WorkflowRunDetail } from "./types";

export type RuntimeRunStatus = "queued" | "running" | "waiting" | "succeeded" | "failed" | "cancelled" | "indeterminate";
export type RuntimeAttemptStatus = "admitted" | "dispatching" | "succeeded" | "rejected" | "failed" | "cancelled" | "indeterminate";
export interface RuntimeRunRecord {
	type: "runtime_run";
	id: string;
	workflow_id: string;
	workflow_version: string;
	workflow_revision: string;
	event_id: string;
	event_contract: ExactContractReference;
	admitted_plan: Omit<AdmittedWorkflowPlan, "event"> & { event: Omit<AdmittedWorkflowPlan["event"], "source_declaration_digest"> & { source_declaration_digest?: string } };
	trigger_id: string;
	idempotency_key: string;
	concurrency_group: string;
	status: RuntimeRunStatus;
	created_at: string;
	updated_at: string;
	started_at?: string;
	finished_at?: string;
	"x-tasknotes"?: unknown;
}
export interface RuntimeAttemptRecord {
	type: "runtime_action_attempt";
	id: string;
	run_id: string;
	step_id: string;
	request_id: string;
	invocation_id: string;
	attempt_id: string;
	contract: ExactContractReference;
	provider: ImplementationIdentity;
	provider_declaration_digest: string;
	handler_id: string;
	idempotency_key: string;
	status: RuntimeAttemptStatus;
	request: Record<string, unknown>;
	outcome?: ActionOutcome;
	created_at: string;
	updated_at: string;
	completed_at?: string;
	"x-tasknotes"?: unknown;
}
export const LOCAL_EXECUTOR: ImplementationIdentity = {
	application: "tasknotes-workflows", implementation: "obsidian-client", version: "0.1.6",
};
export const digest = (value: unknown): Promise<string> => portableDigest(value);

/** Keep the existing UI DTO inside a named extension, not the portable fields. */
export function historyRecord(detail: WorkflowRunDetail): unknown {
	if (!detail.runtime) return detail;
	const { runtime, attempts, ...view } = detail;
	return { ...runtime, "x-tasknotes": { ...asRecord(runtime["x-tasknotes"]), view, attempts } };
}
export function historyDetail(record: unknown): WorkflowRunDetail {
	const raw = asRecord(record);
	if (raw.type !== "runtime_run") return record as WorkflowRunDetail;
	const extension = asRecord(raw["x-tasknotes"]);
	const { "x-tasknotes": _extension, ...runtime } = raw;
	return { ...asRecord(extension.view), runtime, attempts: extension.attempts } as unknown as WorkflowRunDetail;
}
function asRecord(value: unknown): Record<string, unknown> {
	return value && typeof value === "object" ? value as Record<string, unknown> : {};
}
