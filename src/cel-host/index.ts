// Copied from mdbase-spec packages/cel-host/src/index.ts
// Origin commit: 47d257d6a56e34c7279e5ebb959af0b0f49744b2 (MIT).
export {
  applyReadDefaults,
  buildFileActivation,
  buildRecordActivation,
  buildWorkflowActivation,
  evaluateTemplate,
  extractBodyTags,
  extractTags,
  hasTag,
  inFolder,
  RESERVED_NAMES,
  withMissingFieldsAsNull
} from "./activation.js";
export type {
  BuildRecordActivationOptions,
  BuildWorkflowActivationOptions,
  MdbaseFileActivation,
  RecordActivation,
  WorkflowActivation
} from "./activation.js";
export { evaluateCel, evaluateExpressionValueTemplate, normalizeCelValue } from "./evaluate.js";
export type { CelDiagnostic, CelEvaluationResult, EvaluateCelOptions } from "./evaluate.js";
export * as dates from "./dates.js";
export { parseMarkdownRecord } from "./markdown.js";
export type { MarkdownRecord } from "./markdown.js";

