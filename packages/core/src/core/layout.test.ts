import { Temporal } from '@js-temporal/polyfill';
import { describe, expect, it } from 'vitest';
import {
  getTimePosition,
  layoutMultiDayEvents,
  layoutTimedEvents,
  moveEvent,
  resizeEvent,
  snapTimeFromPosition,
} from './layout';

const zdt = (iso: string) => Temporal.ZonedDateTime.from(iso);
const pd = (iso: string) => Temporal.PlainDate.from(iso);
const pt = (iso: string) => Temporal.PlainTime.from(iso);

describe('layoutTimedEvents', () => {
  it('returns empty array when items is empty', () => {
    const empty: Array<{ start: Temporal.ZonedDateTime; end: Temporal.ZonedDateTime }> = [];
    expect(
      layoutTimedEvents(empty, {
        date: pd('2026-07-10'),
        getStart: (e) => e.start,
        getEnd: (e) => e.end,
      }),
    ).toEqual([]);
  });

  it('positions non-overlapping events in single columns', () => {
    const events = [
      { id: 'morning', start: zdt('2026-07-10T09:00[UTC]'), end: zdt('2026-07-10T10:00[UTC]') },
      { id: 'afternoon', start: zdt('2026-07-10T14:00[UTC]'), end: zdt('2026-07-10T16:00[UTC]') },
    ];

    const laid = layoutTimedEvents(events, {
      date: pd('2026-07-10'),
      getStart: (e) => e.start,
      getEnd: (e) => e.end,
      dayStart: pt('08:00'),
      dayEnd: pt('18:00'),
    });

    expect(laid).toHaveLength(2);
    expect(laid[0]).toMatchObject({
      item: events[0],
      top: 0.1,
      height: 0.1,
      column: 0,
      columns: 1,
    });
    expect(laid[1]).toMatchObject({
      item: events[1],
      top: 0.6,
      height: 0.2,
      column: 0,
      columns: 1,
    });
  });

  it('places overlapping clusters side-by-side and reuses columns when earlier events end', () => {
    const events = [
      { id: 'a', start: zdt('2026-07-10T09:00[UTC]'), end: zdt('2026-07-10T12:00[UTC]') },
      { id: 'b', start: zdt('2026-07-10T09:30[UTC]'), end: zdt('2026-07-10T10:30[UTC]') },
      { id: 'c', start: zdt('2026-07-10T10:30[UTC]'), end: zdt('2026-07-10T11:30[UTC]') },
      { id: 'd', start: zdt('2026-07-10T14:00[UTC]'), end: zdt('2026-07-10T15:00[UTC]') },
    ];

    const laid = layoutTimedEvents(events, {
      date: pd('2026-07-10'),
      getStart: (e) => e.start,
      getEnd: (e) => e.end,
    });

    const byId = Object.fromEntries(laid.map((l) => [l.item.id, l]));
    expect(byId.a).toMatchObject({ column: 0, columns: 2 });
    expect(byId.b).toMatchObject({ column: 1, columns: 2 });
    // c starts exactly when b ends, so it reuses column 1 within the same 2-column cluster
    expect(byId.c).toMatchObject({ column: 1, columns: 2 });
    // d is disconnected from the morning cluster
    expect(byId.d).toMatchObject({ column: 0, columns: 1 });
  });

  it('clips events extending outside the visible window and skips out-of-window or zero-length events', () => {
    const events = [
      { id: 'before', start: zdt('2026-07-10T06:00[UTC]'), end: zdt('2026-07-10T08:00[UTC]') },
      { id: 'clipStart', start: zdt('2026-07-10T07:00[UTC]'), end: zdt('2026-07-10T10:00[UTC]') },
      { id: 'clipEnd', start: zdt('2026-07-10T16:00[UTC]'), end: zdt('2026-07-10T20:00[UTC]') },
      { id: 'zero', start: zdt('2026-07-10T12:00[UTC]'), end: zdt('2026-07-10T12:00[UTC]') },
    ];

    const laid = layoutTimedEvents(events, {
      date: pd('2026-07-10'),
      getStart: (e) => e.start,
      getEnd: (e) => e.end,
      dayStart: pt('08:00'),
      dayEnd: pt('18:00'),
    });

    expect(laid.map((l) => l.item.id)).toEqual(['clipStart', 'clipEnd']);
    expect(laid[0]).toMatchObject({ top: 0, height: 0.2 });
    expect(laid[1]).toMatchObject({ top: 0.8, height: 0.2 });
  });

  it('handles DST spring-forward day (23 hours) using exact elapsed nanoseconds', () => {
    // 2026-03-08 is US spring-forward in America/New_York (23-hour day)
    const events = [
      {
        id: 'noon',
        start: zdt('2026-03-08T12:00[America/New_York]'),
        end: zdt('2026-03-08T13:00[America/New_York]'),
      },
    ];

    const laid = layoutTimedEvents(events, {
      date: pd('2026-03-08'),
      getStart: (e) => e.start,
      getEnd: (e) => e.end,
    });

    expect(laid[0].top).toBeCloseTo(11 / 23, 6);
    expect(laid[0].height).toBeCloseTo(1 / 23, 6);
  });
});

describe('layoutMultiDayEvents', () => {
  const weekStart = pd('2026-07-06'); // Monday
  const weekEnd = pd('2026-07-12'); // Sunday

  it('computes column spans, continuation flags, and packs non-overlapping rows', () => {
    const events = [
      { id: 'cross-left', start: pd('2026-07-04'), end: pd('2026-07-07') },
      { id: 'mid-week', start: pd('2026-07-08'), end: pd('2026-07-10') },
      { id: 'overlap', start: pd('2026-07-07'), end: pd('2026-07-09') },
      { id: 'cross-right', start: pd('2026-07-11'), end: pd('2026-07-15') },
      { id: 'outside', start: pd('2026-07-13'), end: pd('2026-07-14') },
    ];

    const bars = layoutMultiDayEvents(events, {
      start: weekStart,
      end: weekEnd,
      getStart: (e) => e.start,
      getEnd: (e) => e.end,
    });

    const byId = Object.fromEntries(bars.map((b) => [b.item.id, b]));
    expect(byId.outside).toBeUndefined();
    expect(byId['cross-left']).toMatchObject({
      startCol: 0,
      span: 2,
      row: 0,
      continuesBefore: true,
      continuesAfter: false,
    });
    expect(byId['mid-week']).toMatchObject({
      startCol: 2,
      span: 3,
      row: 0,
      continuesBefore: false,
      continuesAfter: false,
    });
    expect(byId['cross-right']).toMatchObject({
      startCol: 5,
      span: 2,
      row: 0,
      continuesBefore: false,
      continuesAfter: true,
    });
    expect(byId.overlap).toMatchObject({
      startCol: 1,
      span: 3,
      row: 1,
      continuesBefore: false,
      continuesAfter: false,
    });
  });
});

describe('time position and interaction helpers', () => {
  it('computes normalized time positions for PlainTime and ZonedDateTime', () => {
    const config = { dayStart: pt('08:00'), dayEnd: pt('18:00') };
    expect(getTimePosition(pt('13:00'), config)).toBeCloseTo(0.5);
    expect(getTimePosition(zdt('2026-07-10T10:30[UTC]'), config)).toBeCloseTo(0.25);
    expect(getTimePosition(pt('07:00'), config)).toBeCloseTo(-0.1);
  });

  it('snaps pointer ratios to slotDuration boundaries', () => {
    const config = {
      dayStart: pt('08:00'),
      dayEnd: pt('18:00'),
      slotDuration: Temporal.Duration.from({ minutes: 30 }),
    };

    expect(snapTimeFromPosition(0, config).toString()).toBe('08:00:00');
    expect(snapTimeFromPosition(0.5, config).toString()).toBe('13:00:00');
    // 0.23 of 10h = 2h18m -> 10:18 -> snaps to 10:30
    expect(snapTimeFromPosition(0.23, config).toString()).toBe('10:30:00');
    // Clamps out-of-range ratios to clean slot boundaries
    expect(snapTimeFromPosition(-0.5, config).toString()).toBe('08:00:00');
    expect(snapTimeFromPosition(1.5, config).toString()).toBe('18:00:00');
  });

  it('moves an event preserving exact elapsed duration', () => {
    const start = zdt('2026-07-10T09:00[America/New_York]');
    const end = zdt('2026-07-10T10:30[America/New_York]');
    const targetStart = zdt('2026-07-11T14:15[America/New_York]');

    const moved = moveEvent(start, end, targetStart);
    expect(moved.start.toString()).toBe(targetStart.toString());
    expect(moved.end.toString()).toBe(zdt('2026-07-11T15:45[America/New_York]').toString());
  });

  it('resizes an event and enforces optional minDuration or prevents inverted ranges', () => {
    const start = zdt('2026-07-10T09:00[UTC]');
    const end = zdt('2026-07-10T10:00[UTC]');

    expect(resizeEvent(start, end, zdt('2026-07-10T11:30[UTC]')).end.toString()).toBe(
      zdt('2026-07-10T11:30[UTC]').toString(),
    );

    // Inverted without minDuration preserves original end
    expect(resizeEvent(start, end, zdt('2026-07-10T08:00[UTC]')).end.toString()).toBe(
      end.toString(),
    );

    // Enforces minDuration
    const resizedMin = resizeEvent(
      start,
      end,
      zdt('2026-07-10T09:05[UTC]'),
      Temporal.Duration.from({ minutes: 30 }),
    );
    expect(resizedMin.end.toString()).toBe(zdt('2026-07-10T09:30[UTC]').toString());
  });
});
