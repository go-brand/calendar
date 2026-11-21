import { Temporal } from '../temporal';
import type {
  MultiDayEventLayout,
  MultiDayLayoutOptions,
  TimedEventLayout,
  TimedLayoutOptions,
  TimedViewConfig,
} from '../types';

const NANOSECONDS_PER_DAY = 86_400_000_000_000n;

function plainTimeToNs(time: Temporal.PlainTime): bigint {
  return (
    BigInt(time.hour) * 3_600_000_000_000n +
    BigInt(time.minute) * 60_000_000_000n +
    BigInt(time.second) * 1_000_000_000n +
    BigInt(time.millisecond) * 1_000_000n +
    BigInt(time.microsecond) * 1_000n +
    BigInt(time.nanosecond)
  );
}

function nsToPlainTime(ns: bigint): Temporal.PlainTime {
  const clamped = ns < 0n ? 0n : ns >= NANOSECONDS_PER_DAY ? NANOSECONDS_PER_DAY - 1n : ns;
  const hour = Number(clamped / 3_600_000_000_000n);
  const remHour = clamped % 3_600_000_000_000n;
  const minute = Number(remHour / 60_000_000_000n);
  const remMinute = remHour % 60_000_000_000n;
  const second = Number(remMinute / 1_000_000_000n);
  const remSecond = remMinute % 1_000_000_000n;
  const millisecond = Number(remSecond / 1_000_000n);
  const remMs = remSecond % 1_000_000n;
  const microsecond = Number(remMs / 1_000n);
  const nanosecond = Number(remMs % 1_000n);
  return Temporal.PlainTime.from({
    hour,
    minute,
    second,
    millisecond,
    microsecond,
    nanosecond,
  });
}

function durationToNs(duration: Temporal.Duration): bigint {
  const totalNs = duration.total({ unit: 'nanosecond' });
  if (!Number.isFinite(totalNs) || totalNs <= 0) {
    throw new Error('slotDuration must be a positive time duration');
  }
  return BigInt(Math.round(totalNs));
}

function dayWindowNs(config?: Pick<TimedViewConfig, 'dayStart' | 'dayEnd'>) {
  const startNs = config?.dayStart ? plainTimeToNs(config.dayStart) : 0n;
  const endNs = config?.dayEnd ? plainTimeToNs(config.dayEnd) : NANOSECONDS_PER_DAY;
  if (endNs <= startNs) {
    throw new Error('dayEnd must be after dayStart');
  }
  return { startNs, endNs, spanNs: endNs - startNs };
}

/**
 * Computes normalized vertical geometry and overlapping column layout for timed events on a day.
 * Events are clipped to [dayStart, dayEnd] and grouped into connected collision clusters.
 */
export function layoutTimedEvents<TItem>(
  items: readonly TItem[],
  options: TimedLayoutOptions<TItem>,
): TimedEventLayout<TItem>[] {
  if (items.length === 0) return [];

  const { date, getStart, getEnd, dayStart, dayEnd } = options;
  const firstStart = getStart(items[0]);
  const timeZone = options.timeZone ?? firstStart.timeZoneId;

  const midnight = Temporal.PlainTime.from('00:00');
  const windowStart = date.toZonedDateTime({
    timeZone,
    plainTime: dayStart ?? midnight,
  });
  const windowEnd = dayEnd
    ? date.toZonedDateTime({ timeZone, plainTime: dayEnd })
    : date.add({ days: 1 }).toZonedDateTime({ timeZone, plainTime: midnight });

  const windowStartNs = windowStart.epochNanoseconds;
  const windowEndNs = windowEnd.epochNanoseconds;
  const totalNs = windowEndNs - windowStartNs;
  if (totalNs <= 0n) {
    throw new Error('dayEnd must be after dayStart');
  }

  type Candidate = {
    item: TItem;
    start: Temporal.ZonedDateTime;
    end: Temporal.ZonedDateTime;
    clampedStartNs: bigint;
    clampedEndNs: bigint;
    column: number;
  };

  const candidates: Candidate[] = [];
  for (const item of items) {
    const start = getStart(item);
    const end = getEnd(item);
    const startNs = start.epochNanoseconds;
    const endNs = end.epochNanoseconds;
    if (endNs <= startNs) continue;
    if (endNs <= windowStartNs || startNs >= windowEndNs) continue;

    candidates.push({
      item,
      start,
      end,
      clampedStartNs: startNs < windowStartNs ? windowStartNs : startNs,
      clampedEndNs: endNs > windowEndNs ? windowEndNs : endNs,
      column: 0,
    });
  }

  if (candidates.length === 0) return [];

  candidates.sort((a, b) => {
    if (a.clampedStartNs !== b.clampedStartNs) {
      return a.clampedStartNs < b.clampedStartNs ? -1 : 1;
    }
    const aDuration = a.clampedEndNs - a.clampedStartNs;
    const bDuration = b.clampedEndNs - b.clampedStartNs;
    if (aDuration !== bDuration) {
      return aDuration > bDuration ? -1 : 1;
    }
    return 0;
  });

  const results: TimedEventLayout<TItem>[] = [];
  let cluster: Candidate[] = [];
  let columnEnds: bigint[] = [];
  let clusterMaxEnd = -1n;

  const flushCluster = () => {
    const columns = columnEnds.length;
    for (const entry of cluster) {
      const top = Number(entry.clampedStartNs - windowStartNs) / Number(totalNs);
      const height = Number(entry.clampedEndNs - entry.clampedStartNs) / Number(totalNs);
      results.push({
        item: entry.item,
        start: entry.start,
        end: entry.end,
        top,
        height,
        column: entry.column,
        columns,
      });
    }
    cluster = [];
    columnEnds = [];
    clusterMaxEnd = -1n;
  };

  for (const entry of candidates) {
    if (cluster.length > 0 && entry.clampedStartNs >= clusterMaxEnd) {
      flushCluster();
    }

    let placedColumn = columnEnds.findIndex((colEnd) => colEnd <= entry.clampedStartNs);
    if (placedColumn === -1) {
      placedColumn = columnEnds.length;
      columnEnds.push(entry.clampedEndNs);
    } else {
      columnEnds[placedColumn] = entry.clampedEndNs;
    }

    entry.column = placedColumn;
    cluster.push(entry);
    if (entry.clampedEndNs > clusterMaxEnd) {
      clusterMaxEnd = entry.clampedEndNs;
    }
  }

  if (cluster.length > 0) {
    flushCluster();
  }

  return results;
}

/**
 * Computes spanning bar positions and vertical row tracks for multi-day events
 * within an inclusive [start, end] date range (such as a month week row or week header).
 */
export function layoutMultiDayEvents<TItem>(
  items: readonly TItem[],
  options: MultiDayLayoutOptions<TItem>,
): MultiDayEventLayout<TItem>[] {
  const { start, end, getStart, getEnd } = options;
  if (Temporal.PlainDate.compare(end, start) < 0) {
    throw new Error('end must be on or after start');
  }
  if (items.length === 0) return [];

  type Segment = {
    item: TItem;
    startCol: number;
    span: number;
    continuesBefore: boolean;
    continuesAfter: boolean;
  };

  const segments: Segment[] = [];
  for (const item of items) {
    const itemStart = getStart(item);
    const itemEnd = getEnd(item);
    if (Temporal.PlainDate.compare(itemEnd, itemStart) < 0) continue;
    if (Temporal.PlainDate.compare(itemEnd, start) < 0) continue;
    if (Temporal.PlainDate.compare(itemStart, end) > 0) continue;

    const continuesBefore = Temporal.PlainDate.compare(itemStart, start) < 0;
    const continuesAfter = Temporal.PlainDate.compare(itemEnd, end) > 0;
    const clampedStart = continuesBefore ? start : itemStart;
    const clampedEnd = continuesAfter ? end : itemEnd;

    const startCol = start.until(clampedStart, { largestUnit: 'days' }).days;
    const span = clampedStart.until(clampedEnd, { largestUnit: 'days' }).days + 1;

    segments.push({
      item,
      startCol,
      span,
      continuesBefore,
      continuesAfter,
    });
  }

  segments.sort((a, b) => a.startCol - b.startCol || b.span - a.span);

  const rowEndCols: number[] = [];
  return segments.map((segment) => {
    const endCol = segment.startCol + segment.span - 1;
    let row = rowEndCols.findIndex((lastEnd) => lastEnd < segment.startCol);
    if (row === -1) {
      row = rowEndCols.length;
      rowEndCols.push(endCol);
    } else {
      rowEndCols[row] = endCol;
    }

    return {
      item: segment.item,
      startCol: segment.startCol,
      span: segment.span,
      row,
      continuesBefore: segment.continuesBefore,
      continuesAfter: segment.continuesAfter,
    };
  });
}

/**
 * Returns the normalized vertical position of a time within [dayStart, dayEnd].
 * Values in [0, 1] fall inside the visible window; values outside indicate before/after.
 */
export function getTimePosition(
  time: Temporal.PlainTime | Temporal.ZonedDateTime,
  config?: Pick<TimedViewConfig, 'dayStart' | 'dayEnd'>,
): number {
  const { startNs, spanNs } = dayWindowNs(config);
  const plainTime = 'toPlainTime' in time ? time.toPlainTime() : time;
  return Number(plainTimeToNs(plainTime) - startNs) / Number(spanNs);
}

/**
 * Maps a normalized vertical position ratio in [0, 1] (such as a pointer offset)
 * to the nearest snapped Temporal.PlainTime boundary.
 */
export function snapTimeFromPosition(ratio: number, config?: TimedViewConfig): Temporal.PlainTime {
  const { startNs, endNs, spanNs } = dayWindowNs(config);
  const stepNs = config?.slotDuration ? durationToNs(config.slotDuration) : 3_600_000_000_000n;

  const clampedRatio = Math.min(1, Math.max(0, ratio));
  const rawOffsetNs = BigInt(Math.round(clampedRatio * Number(spanNs)));
  const maxStep = endNs >= NANOSECONDS_PER_DAY ? (spanNs - 1n) / stepNs : spanNs / stepNs;
  const snappedStep = (rawOffsetNs + stepNs / 2n) / stepNs;
  const boundedStep = snappedStep < 0n ? 0n : snappedStep > maxStep ? maxStep : snappedStep;

  return nsToPlainTime(startNs + boundedStep * stepNs);
}

/**
 * Moves a timed event to a new start while preserving its exact elapsed duration.
 */
export function moveEvent(
  start: Temporal.ZonedDateTime,
  end: Temporal.ZonedDateTime,
  targetStart: Temporal.ZonedDateTime,
): { start: Temporal.ZonedDateTime; end: Temporal.ZonedDateTime } {
  const durationNs = end.epochNanoseconds - start.epochNanoseconds;
  const nextEnd = Temporal.Instant.fromEpochNanoseconds(
    targetStart.epochNanoseconds + durationNs,
  ).toZonedDateTimeISO(targetStart.timeZoneId);
  return { start: targetStart, end: nextEnd };
}

/**
 * Resizes a timed event to a new end, enforcing an optional minimum duration
 * and preventing inverted ranges.
 */
export function resizeEvent(
  start: Temporal.ZonedDateTime,
  end: Temporal.ZonedDateTime,
  nextEnd: Temporal.ZonedDateTime,
  minDuration?: Temporal.Duration,
): { start: Temporal.ZonedDateTime; end: Temporal.ZonedDateTime } {
  if (minDuration) {
    const minEnd = start.add(minDuration);
    return {
      start,
      end: Temporal.ZonedDateTime.compare(nextEnd, minEnd) < 0 ? minEnd : nextEnd,
    };
  }
  return {
    start,
    end: Temporal.ZonedDateTime.compare(nextEnd, start) <= 0 ? end : nextEnd,
  };
}
