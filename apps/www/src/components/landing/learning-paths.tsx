import { Link } from '@tanstack/react-router';

const paths = [
  {
    label: 'Human quick start',
    title: 'Render your first month',
    body: 'Install, configure views, add items, and navigate a real calendar.',
    href: '/docs/installation',
    external: false,
  },
  {
    label: 'Architecture',
    title: 'Fetch below Suspense',
    body: 'Keep controls interactive while each view owns its query and item type.',
    href: '/docs/data-and-suspense',
    external: false,
  },
  {
    label: 'Agent context',
    title: 'Give your agent the contract',
    body: 'Canonical examples, public types, range semantics, and decision rules in one file.',
    href: 'https://eng.gobrand.app/calendar/llms.txt',
    external: true,
  },
] as const;

export function LearningPaths() {
  return (
    <section className="landing-section landing-learning" aria-labelledby="learning-title">
      <div className="landing-heading">
        <p className="landing-kicker">Learn from compiling examples</p>
        <h2 id="learning-title">
          For humans who need the why. For agents that need the exact contract.
        </h2>
      </div>

      <div className="landing-learning-links">
        {paths.map((path) => {
          const className = 'landing-learning-link';
          const content = (
            <>
              <span className="landing-learning-copy">
                <span>{path.label}</span>
                <strong>{path.title}</strong>
                <span>{path.body}</span>
              </span>
              <span aria-hidden="true">→</span>
            </>
          );

          return path.external ? (
            <a key={path.title} href={path.href} className={className}>
              {content}
            </a>
          ) : (
            <Link
              key={path.title}
              to="/docs/$"
              params={{ _splat: path.href.replace('/docs/', '') }}
              className={className}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
