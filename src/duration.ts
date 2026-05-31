const DURATION_PATTERN = /^\s*(\d+)\s*(ms|s|m|h|d)?\s*$/iu;

export function parseDurationMs(value: string | undefined, fallbackMs: number): number {
	if (!value) return fallbackMs;
	const match = value.match(DURATION_PATTERN);
	if (!match) return fallbackMs;

	const amount = Number(match[1]);
	const unit = (match[2] ?? "ms").toLowerCase();
	if (unit === "ms") return amount;
	if (unit === "s") return amount * 1000;
	if (unit === "m") return amount * 60_000;
	if (unit === "h") return amount * 3_600_000;
	if (unit === "d") return amount * 86_400_000;
	return fallbackMs;
}

export function todayString(date = new Date()): string {
	return [
		String(date.getFullYear()).padStart(4, "0"),
		String(date.getMonth() + 1).padStart(2, "0"),
		String(date.getDate()).padStart(2, "0"),
	].join("-");
}

