import { Temporal as PolyfillTemporal } from '@js-temporal/polyfill';
import { afterEach, describe, expect, it } from 'vitest';
import { Temporal as NativeTemporal } from './temporal.native';

const globalWithTemporal = globalThis as { Temporal?: typeof PolyfillTemporal };
const originalTemporal = globalWithTemporal.Temporal;

describe('native Temporal adapter', () => {
  afterEach(() => {
    if (originalTemporal === undefined) {
      delete globalWithTemporal.Temporal;
    } else {
      globalWithTemporal.Temporal = originalTemporal;
    }
  });

  it('delegates to globalThis.Temporal when available', () => {
    globalWithTemporal.Temporal = PolyfillTemporal;
    const date = NativeTemporal.PlainDate.from('2026-07-10');
    expect(date.toString()).toBe('2026-07-10');
  });

  it('throws a clear error when globalThis.Temporal is unavailable', () => {
    delete globalWithTemporal.Temporal;
    expect(() => NativeTemporal.PlainDate.from('2026-07-10')).toThrow(
      /globalThis\.Temporal is not available/,
    );
  });
});
