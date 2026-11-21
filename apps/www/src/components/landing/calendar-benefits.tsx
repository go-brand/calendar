const benefits = [
  [
    'Zero Date bugs',
    'Built exclusively on Temporal with explicit timezones, DST-safe math, and half-open ranges.',
  ],
  [
    'Headless, not bare',
    'Overlap collision layout, multi-day bars, DnD time-snapping, and WAI-ARIA keyboard grids included.',
  ],
  [
    'Zero-polyfill /native',
    'Ship the polyfilled default today, or import /native where globalThis.Temporal is built in.',
  ],
  [
    'Your data, your types',
    'No forced event schema. Pass any array with direct callbacks and keep full TypeScript inference.',
  ],
] as const;

export function CalendarBenefits() {
  return (
    <section className="landing-section landing-benefits" aria-labelledby="benefits-title">
      <h2 id="benefits-title">Simple primitives. Zero calendar bloat.</h2>
      <div className="landing-benefit-list">
        {benefits.map(([title, description]) => (
          <div key={title} className="landing-benefit-row">
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
