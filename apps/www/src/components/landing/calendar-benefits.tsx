const benefits = [
  ['Timezone explicit', 'Today, visible ranges, and item projection share one timezone.'],
  ['Boundary safe', 'Half-open ranges prevent duplicated events between views.'],
  ['Data independent', 'Each projection keeps its own item type and query lifecycle.'],
] as const;

export function CalendarBenefits() {
  return (
    <section className="landing-section landing-benefits" aria-labelledby="benefits-title">
      <h2 id="benefits-title">Calendar contracts that stay explicit</h2>
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
