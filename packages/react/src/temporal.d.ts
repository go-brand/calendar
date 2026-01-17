/**
 * Type definitions for the Temporal API
 * Uses @js-temporal/polyfill types
 */

import type { Temporal as TemporalType } from '@js-temporal/polyfill';

declare global {
  const Temporal: typeof TemporalType;
}

export {};
