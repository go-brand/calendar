'use client';

import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { CalendarPreview } from '@/components/preview';
import { copyText } from '@/lib/copy-text';

const installCommand = 'pnpm add @gobrand/react-calendar @js-temporal/polyfill';

export function CalendarHero() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2_000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function copyInstall() {
    setCopied(await copyText(installCommand));
  }

  return (
    <section className="landing-hero">
      <div className="landing-intro">
        <p className="landing-kicker">Temporal-first calendar engine</p>
        <h1>Build calendars without timezone bugs.</h1>
        <p className="landing-description">
          Headless month, week, and day views with explicit timezone, range, and projection
          contracts.
        </p>

        <div className="landing-actions">
          <button type="button" onClick={copyInstall}>
            <code>{installCommand}</code>
            <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <Link to="/docs/$" params={{ _splat: '' }}>
            Read the docs
          </Link>
        </div>
      </div>

      <div className="landing-demo-surface">
        <CalendarPreview name="basic-month" className="landing-demo" />
      </div>
    </section>
  );
}
