import { Temporal } from "@js-temporal/polyfill";
import { describe, expect, test } from "vitest";
import { getDayDateRange, getWeekDateRange } from "./dateRanges";

/**
 * Daylight-saving-time correctness.
 *
 * The library advertises DST-safe, timezone-aware ranges. These tests pin the
 * behavior that proves it: on a transition day the wall-clock boundaries stay on
 * the same calendar date, but the UTC offset shifts mid-day and the *real*
 * elapsed time of the day is 23h (spring forward) or 25h (fall back) instead of
 * 24h. A naive PlainDate-to-epoch implementation that assumed 24-hour days would
 * fail every assertion below.
 *
 * Reference transitions (verified against the tzdata in @js-temporal/polyfill):
 *   America/New_York spring forward: 2026-03-08 (02:00 -> 03:00)
 *   America/New_York fall back:      2026-11-01 (02:00 -> 01:00)
 *   Europe/Madrid    spring forward: 2026-03-29 (02:00 -> 03:00)
 *   Europe/Madrid    fall back:      2026-10-25 (03:00 -> 02:00)
 */

function elapsed(range: { start: Temporal.ZonedDateTime; end: Temporal.ZonedDateTime }) {
  return range.start.until(range.end, { largestUnit: "hour" });
}

describe("getDayDateRange across DST transitions", () => {
  test("spring-forward day is 23 hours long (America/New_York)", () => {
    const range = getDayDateRange(Temporal.PlainDate.from("2026-03-08"), "America/New_York");

    // Boundaries remain on the same calendar date with normal wall-clock times.
    expect(range.start.toPlainDate().toString()).toBe("2026-03-08");
    expect(range.end.toPlainDate().toString()).toBe("2026-03-09");
    expect(range.start.toPlainTime().toString()).toBe("00:00:00");
    expect(range.end.toPlainTime().toString()).toBe("00:00:00");

    // The UTC offset shifts within the day: EST (-05:00) -> EDT (-04:00).
    expect(range.start.offset).toBe("-05:00");
    expect(range.end.offset).toBe("-04:00");

    // Real elapsed time is one hour short of a full day.
    const dur = elapsed(range);
    expect(dur.hours).toBe(23);
    expect(dur.minutes).toBe(0);
  });

  test("fall-back day is 25 hours long (America/New_York)", () => {
    const range = getDayDateRange(Temporal.PlainDate.from("2026-11-01"), "America/New_York");

    expect(range.start.toPlainDate().toString()).toBe("2026-11-01");
    expect(range.end.toPlainDate().toString()).toBe("2026-11-02");
    expect(range.start.offset).toBe("-04:00"); // EDT
    expect(range.end.offset).toBe("-05:00"); // EST

    const dur = elapsed(range);
    expect(dur.hours).toBe(25);
    expect(dur.minutes).toBe(0);
  });

  test("a normal day is exactly 24 hours with a stable offset", () => {
    const range = getDayDateRange(Temporal.PlainDate.from("2026-06-15"), "America/New_York");

    expect(range.start.offset).toBe("-04:00");
    expect(range.end.offset).toBe("-04:00");
    const dur = elapsed(range);
    expect(dur.hours).toBe(24);
    expect(dur.minutes).toBe(0);
  });

  test("spring-forward and fall-back work for Europe/Madrid too", () => {
    const spring = getDayDateRange(Temporal.PlainDate.from("2026-03-29"), "Europe/Madrid");
    expect(spring.start.offset).toBe("+01:00"); // CET
    expect(spring.end.offset).toBe("+02:00"); // CEST
    expect(elapsed(spring).hours).toBe(23);

    const fall = getDayDateRange(Temporal.PlainDate.from("2026-10-25"), "Europe/Madrid");
    expect(fall.start.offset).toBe("+02:00"); // CEST
    expect(fall.end.offset).toBe("+01:00"); // CET
    expect(elapsed(fall).hours).toBe(25);
  });
});

describe("getWeekDateRange spanning a DST transition", () => {
  test("a week containing a spring-forward keeps 7 calendar days and correct boundaries", () => {
    // 2026-03-08 (NY spring forward) falls in the week of Mon Mar 2 .. Sun Mar 8.
    const range = getWeekDateRange(Temporal.PlainDate.from("2026-03-08"), "America/New_York", {
      weekStartsOn: 1,
    });

    expect(range.start.toPlainDate().toString()).toBe("2026-03-02");
    expect(range.end.toPlainDate().toString()).toBe("2026-03-09");
    // The week still spans 6 calendar days start-to-end despite the lost hour.
    const dayGap = range.start
      .toPlainDate()
      .until(range.end.toPlainDate(), { largestUnit: "day" }).days;
    expect(dayGap).toBe(7);
    // Boundaries clamp to start- and end-of-day in the zone.
    expect(range.start.toPlainTime().toString()).toBe("00:00:00");
    expect(range.end.toPlainTime().toString()).toBe("00:00:00");
    expect(range.start.timeZoneId).toBe("America/New_York");
  });
});
