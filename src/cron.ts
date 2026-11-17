export function cronMatches(schedule: string, date: Date, timezone?: string): boolean {
	const fields = schedule.trim().split(/\s+/u);
	if (fields.length !== 5) return false;

	const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;
	let values = [date.getMinutes(), date.getHours(), date.getDate(), date.getMonth() + 1, date.getDay()];
	if (timezone && timezone !== "local") {
		const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, minute: "numeric", hour: "numeric", day: "numeric", month: "numeric", weekday: "short", hourCycle: "h23" }).formatToParts(date);
		const get = (type: string): string => parts.find((part) => part.type === type)?.value ?? "";
		values = [Number(get("minute")), Number(get("hour")), Number(get("day")), Number(get("month")), ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"))];
	}
	return (
		fieldMatches(minute, values[0] ?? 0, 0, 59) &&
		fieldMatches(hour, values[1] ?? 0, 0, 23) &&
		fieldMatches(dayOfMonth, values[2] ?? 1, 1, 31) &&
		fieldMatches(month, values[3] ?? 1, 1, 12) &&
		fieldMatches(dayOfWeek, values[4] ?? 0, 0, 7)
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

