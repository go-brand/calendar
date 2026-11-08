'use client';

import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Check, Copy } from 'lucide-react';
import { CalendarPreview } from '@/components/preview';
import { copyText } from '@/lib/copy-text';
import { AGENT_PROMPT, INSTALL_COMMAND } from '@/lib/homepage';

export function CalendarHero() {
  const [copied, setCopied] = useState<'agent' | 'install' | null>(null);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(null), 2_000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function copy(value: string, target: 'agent' | 'install') {
    setCopied((await copyText(value)) ? target : null);
  }

  return (
    <section className="landing-hero">
      <div className="landing-intro">
        <h1>Build the calendar, not the date math.</h1>
        <p className="landing-description">
          Month, week, and day views for React, built on Temporal. Navigation, timezones, and
          daylight saving handled. You write the markup.
        </p>

        <div className="landing-actions">
          <button
            type="button"
            className="landing-agent-action"
            onClick={() => copy(AGENT_PROMPT, 'agent')}
          >
            {copied === 'agent' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            <span aria-live="polite">
              {copied === 'agent' ? 'Prompt copied' : 'Copy prompt for your agent'}
            </span>
          </button>
          <button
            type="button"
            className="landing-install-action"
            onClick={() => copy(INSTALL_COMMAND, 'install')}
            aria-label={copied === 'install' ? 'Package command copied' : 'Copy package command'}
          >
            <code>{INSTALL_COMMAND}</code>
            {copied === 'install' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          </button>
          <Link to="/docs/$" params={{ _splat: '' }}>
            Read the docs
          </Link>
        </div>

        <p className="landing-agent-note">
          Made for you and your agent. The prompt points it to{' '}
          <a href="https://calendar.gobrand.app/llms.txt">llms.txt</a> and the{' '}
          <a href="https://calendar.gobrand.app/.well-known/agent-skills/calendar/SKILL.md">
            Calendar skill
          </a>
          .
        </p>
      </div>

      <div className="landing-demo-surface">
        <CalendarPreview name="basic-month" className="landing-demo" />
      </div>
    </section>
  );
}
