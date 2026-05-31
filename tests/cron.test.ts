import { describe, expect, it } from "vitest";
import { cronMatches } from "../src/cron";

describe("cron matching", () => {
	it("matches five-field cron schedules", () => {
		expect(cronMatches("0 9 * * *", new Date("2026-05-31T09:00:00"))).toBe(true);
		expect(cronMatches("0 9 * * *", new Date("2026-05-31T09:01:00"))).toBe(false);
		expect(cronMatches("*/15 * * * *", new Date("2026-05-31T09:30:00"))).toBe(true);
	});
});

