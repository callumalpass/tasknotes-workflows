import type { TaskNotesRuntimeTaskQuery } from "./types";

export function defaultRuntimeTaskQuery(): TaskNotesRuntimeTaskQuery {
	return {
		where: {
			all: [
				{
					field: "task.status",
					op: "ne",
					value: "done",
				},
			],
		},
		sort: [{ field: "task.due", direction: "asc" }],
		limit: 25,
	};
}
