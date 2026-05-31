export function cronMatches(schedule: string, date: Date): boolean {
	const fields = schedule.trim().split(/\s+/u);
	if (fields.length !== 5) return false;

	const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;
	return (
		fieldMatches(minute, date.getMinutes(), 0, 59) &&
		fieldMatches(hour, date.getHours(), 0, 23) &&
		fieldMatches(dayOfMonth, date.getDate(), 1, 31) &&
		fieldMatches(month, date.getMonth() + 1, 1, 12) &&
		fieldMatches(dayOfWeek, date.getDay(), 0, 7)
	);
}

export function cronDescription(schedule: string): string {
	const fields = schedule.trim().split(/\s+/u);
	if (fields.length !== 5) return "Invalid cron schedule";
	if (schedule === "0 9 * * *") return "Every day at 09:00";
	if (fields[0]?.startsWith("*/")) return `Every ${fields[0].slice(2)} minutes`;
	return schedule;
}

function fieldMatches(field: string | undefined, value: number, min: number, max: number): boolean {
	if (!field) return false;
	return field.split(",").some((part) => partMatches(part, value, min, max));
}

function partMatches(part: string, value: number, min: number, max: number): boolean {
	if (part === "*") return true;
	const [range, stepText] = part.split("/");
	const step = stepText ? Number(stepText) : 1;
	if (!Number.isFinite(step) || step <= 0) return false;

	let start = min;
	let end = max;
	if (range && range !== "*") {
		if (range.includes("-")) {
			const [startText, endText] = range.split("-");
			start = Number(startText);
			end = Number(endText);
		} else {
			start = Number(range);
			end = Number(range);
		}
	}

	if (end === 7 && value === 0) return true;
	if (value < start || value > end) return false;
	return (value - start) % step === 0;
}

