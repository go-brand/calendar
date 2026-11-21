import type { Temporal as TemporalNamespace } from '@js-temporal/polyfill';

function getNativeTemporal(): typeof TemporalNamespace {
  const temporal = (globalThis as { Temporal?: typeof TemporalNamespace }).Temporal;
  if (!temporal) {
    throw new Error(
      'globalThis.Temporal is not available. Import from "@gobrand/react-calendar" or load a Temporal polyfill.',
    );
  }
  return temporal;
}

export const Temporal = new Proxy({} as typeof TemporalNamespace, {
  get(_target, prop, receiver) {
    return Reflect.get(getNativeTemporal(), prop, receiver);
  },
});
