import { createFileRoute, Link } from '@tanstack/react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { useState } from 'react';
import { motion } from 'motion/react';

export const Route = createFileRoute('/')({
  component: Home,
});

// Calendar visualization component
function CalendarVisualization() {
  const [currentDate] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const today = currentDate.getDate();

  // Generate calendar days
  const days = [];
  const totalCells = 42; // 6 weeks * 7 days

  // Previous month days
  const prevMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, isCurrentMonth: false, isToday: false });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true, isToday: i === today });
  }

  // Next month days
  const remainingDays = totalCells - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({ day: i, isCurrentMonth: false, isToday: false });
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="relative w-full max-w-[420px] mx-auto">
      {/* Glow effect */}
      <motion.div
        className="absolute inset-[-20px] rounded-3xl blur-2xl bg-gradient-to-br from-sky-500/20 via-cyan-400/15 to-transparent"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      />

      {/* Calendar container */}
      <motion.div
        className="relative bg-neutral-900/80 border border-neutral-700/50 rounded-2xl p-5 backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <motion.h3
            className="text-lg font-semibold text-neutral-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {monthName}
          </motion.h3>
          <div className="flex gap-1">
            <motion.button
              type="button"
              className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-neutral-400 hover:text-neutral-200 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
            <motion.button
              type="button"
              className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-neutral-400 hover:text-neutral-200 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdays.map((day, i) => (
            <motion.div
              key={day}
              className="text-center text-xs font-medium text-neutral-500 py-1"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.03 }}
            >
              {day}
            </motion.div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((dayInfo, i) => (
            <motion.div
              key={`day-${dayInfo.day}-${dayInfo.isCurrentMonth}-${i}`}
              className={`
                relative aspect-square flex items-center justify-center text-sm rounded-lg cursor-pointer transition-all
                ${dayInfo.isCurrentMonth ? 'text-neutral-200' : 'text-neutral-600'}
                ${dayInfo.isToday ? 'bg-sky-500 text-white font-semibold' : 'hover:bg-neutral-700/50'}
                ${hoveredDay === i && !dayInfo.isToday ? 'bg-cyan-400/20 ring-1 ring-cyan-400/50' : ''}
              `}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.01 }}
              onMouseEnter={() => setHoveredDay(i)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {dayInfo.day}
              {/* Event indicator */}
              {dayInfo.isCurrentMonth && [5, 12, 18, 23].includes(dayInfo.day) && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Sample events */}
        <motion.div
          className="mt-4 pt-4 border-t border-neutral-700/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <div className="text-xs font-medium text-neutral-400 mb-2">Events</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-sky-400" />
              <span className="text-neutral-300">Team Standup</span>
              <span className="text-neutral-500 ml-auto">9:00 AM</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-neutral-300">Client Meeting</span>
              <span className="text-neutral-500 ml-auto">2:00 PM</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Syntax highlighting for code examples
function highlightCode(code: string): React.ReactNode[] {
  const keywords = ['import', 'from', 'const', 'let', 'var', 'function', 'return', 'async', 'await', 'type', 'export'];
  const keywordPattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');

  return code.split('\n').map((line, lineIndex) => {
    const parts: React.ReactNode[] = [];
    let partKey = 0;

    // Handle comments first
    const commentIndex = line.indexOf('//');
    const mainPart = commentIndex >= 0 ? line.slice(0, commentIndex) : line;
    const commentPart = commentIndex >= 0 ? line.slice(commentIndex) : '';

    // Find all strings in the main part
    const stringPattern = /('[^']*'|"[^"]*")/g;
    const stringMatches: { start: number; end: number; text: string }[] = [];

    let match = stringPattern.exec(mainPart);
    while (match !== null) {
      stringMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
      });
      match = stringPattern.exec(mainPart);
    }

    // Build the line with highlighting
    let currentPos = 0;
    for (const strMatch of stringMatches) {
      // Text before string
      if (strMatch.start > currentPos) {
        const beforeText = mainPart.slice(currentPos, strMatch.start);
        const keywordParts = beforeText.split(keywordPattern);
        keywordParts.forEach((part) => {
          if (keywords.includes(part)) {
            parts.push(<span key={partKey++} className="text-sky-400">{part}</span>);
          } else {
            parts.push(<span key={partKey++}>{part}</span>);
          }
        });
      }
      // The string itself
      parts.push(<span key={partKey++} className="text-cyan-300">{strMatch.text}</span>);
      currentPos = strMatch.end;
    }

    // Remaining text after last string
    if (currentPos < mainPart.length) {
      const remainingText = mainPart.slice(currentPos);
      const keywordParts = remainingText.split(keywordPattern);
      keywordParts.forEach((part) => {
        if (keywords.includes(part)) {
          parts.push(<span key={partKey++} className="text-sky-400">{part}</span>);
        } else {
          parts.push(<span key={partKey++}>{part}</span>);
        }
      });
    }

    // Add comment if present
    if (commentPart) {
      parts.push(<span key={partKey++} className="text-neutral-500">{commentPart}</span>);
    }

    const lineKey = `${line.slice(0, 20).replace(/\s/g, '_')}-${lineIndex}`;
    return (
      <div key={lineKey} className="leading-relaxed">
        {parts.length > 0 ? parts : '\u00A0'}
      </div>
    );
  });
}

// Code example with syntax highlighting
function CodeExample({ code }: { code: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 overflow-hidden h-full w-full">
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="font-mono text-neutral-300 block">{highlightCode(code)}</code>
      </pre>
    </div>
  );
}

// Feature card
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative p-8 bg-gradient-to-br from-neutral-900/30 to-neutral-950/30 border border-neutral-800/50">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500/20 to-cyan-400/10 flex items-center justify-center text-sky-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-neutral-100 mb-2">{title}</h3>
      <p className="text-sm text-neutral-400 leading-relaxed">{description}</p>
    </div>
  );
}

function Home() {
  const reactCode = `import { useCalendar, createCalendarViews } from '@gobrand/react-calendar';
import { Temporal } from '@js-temporal/polyfill';

type Event = {
  id: string;
  title: string;
  start: Temporal.ZonedDateTime;
};

const calendar = useCalendar({
  data: events,
  views: createCalendarViews<Event>()({
    month: { weekStartsOn: 1, accessor },
    week: { startHour: 8, endHour: 18, accessor },
  }),
});

// Type-safe view methods
const month = calendar.getMonth();
const week = calendar.getWeek();`;

  const coreCode = `import { buildMonth, getWeekdays, getMonthName } from '@gobrand/calendar-core';
import { Temporal } from '@js-temporal/polyfill';

// Build any month
const month = buildMonth(2025, 1, {
  weekStartsOn: 1,
  data: events,
  accessor: { getDate: (e) => e.date },
});

// Localized formatting
const weekdays = getWeekdays(1, 'es-ES');
// ["lun", "mar", "mie", "jue", "vie", "sab", "dom"]

const name = getMonthName(month.month, 'ja-JP');
// "1月"`;

  return (
    <HomeLayout {...baseOptions()}>
      {/* Hero Section */}
      <section className="relative pt-16 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Main heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] text-neutral-100 mb-6">
            Build calendars in seconds.
          </h1>

          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl font-light leading-relaxed mb-8">
            A lightweight, framework-agnostic library for building calendars. Multi-view support, timezone-aware, and fully type-safe.
          </p>

          {/* Install command and CTA */}
          <div className="flex flex-wrap items-center gap-4">
            <code className="px-4 py-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 text-neutral-300 font-mono text-sm flex items-center gap-3">
              <span className="text-neutral-500">$</span> pnpm add @gobrand/react-calendar
              <button
                type="button"
                className="p-1 hover:bg-neutral-700/50 rounded transition-colors"
                onClick={() => navigator.clipboard.writeText('pnpm add @gobrand/calendar-core')}
                aria-label="Copy to clipboard"
              >
                <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </code>
            <Link
              to="/docs/$"
              params={{ _splat: '' }}
              className="text-sky-400 hover:text-sky-300 font-medium text-sm transition-colors"
            >
              Read the docs
            </Link>
          </div>
        </div>
      </section>

      {/* Calendar visualization */}
      <section className="relative px-4 pt-8 pb-12 mt-8 overflow-hidden max-w-7xl w-full mx-auto">
        {/* Gradient background */}
        <div className="absolute inset-0 rounded-3xl mx-4 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, #0c4a6e 0%, #0e7490 50%, #06b6d4 100%)`,
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)`,
              backgroundSize: '8px 8px',
            }}
          />
        </div>

        {/* Calendar content */}
        <div className="relative z-10 flex justify-center pt-8 pb-8">
          <CalendarVisualization />
        </div>
      </section>

      {/* Features section */}
      <section className="relative py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sky-950/5 to-transparent" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-100 mb-4">
              Why GoBrand Calendar?
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Like TanStack Table, but for calendars. A headless, type-safe calendar builder that gives you complete control over rendering while handling all the complex calendar logic.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 rounded-xl border overflow-clip">
            <FeatureCard
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              title="Multi-View Support"
              description="Month, week, and day views with type-safe switching. Only get the methods for views you configure."
            />
            <FeatureCard
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              }
              title="Timezone-Aware"
              description="Native Temporal API timezone support. 400+ IANA timezones, DST handling, and automatic date range computation."
            />
            <FeatureCard
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              }
              title="Data-Agnostic"
              description="Works with any data type through the accessor pattern. Map events, tasks, or any items to calendar dates."
            />
            <FeatureCard
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Fully Type-Safe"
              description="TypeScript-first with conditional types. View methods only exist when that view is configured. No runtime checks needed."
            />
            <FeatureCard
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              title="React Integration"
              description="useCalendar hook with TanStack Store for optimal React re-renders. Or use core for vanilla JS."
            />
            <FeatureCard
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              title="Built on Temporal"
              description="Exclusively uses the Temporal API. Immutable by design, nanosecond precision, calendar-aware arithmetic."
            />
          </div>
        </div>
      </section>

      {/* Code examples section */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-100 mb-3">
              Simple, powerful API
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Get started in minutes. Build production-ready calendar UIs.
            </p>
          </div>

          <div className="space-y-8 overflow-hidden">
            {/* React Hook */}
            <div className="grid lg:grid-cols-5 gap-6 lg:gap-16 items-start">
              <div className="lg:col-span-2 flex flex-col justify-center lg:py-4">
                <h3 className="text-xl font-semibold text-neutral-100 mb-2">React Hook</h3>
                <p className="text-neutral-400 leading-relaxed">
                  The <code className="text-sky-400">useCalendar</code> hook provides reactive state management with type-safe methods for configured views.
                </p>
              </div>
              <div className="lg:col-span-3 min-w-0">
                <CodeExample code={reactCode} />
              </div>
            </div>

            {/* Core Functions */}
            <div className="grid lg:grid-cols-5 gap-6 lg:gap-16 items-start">
              <div className="lg:col-span-2 flex flex-col justify-center lg:py-4">
                <h3 className="text-xl font-semibold text-neutral-100 mb-2">Core Functions</h3>
                <p className="text-neutral-400 leading-relaxed">
                  Use standalone functions for maximum flexibility. Build calendars in vanilla JS, server-side rendering, or any framework.
                </p>
              </div>
              <div className="lg:col-span-3 min-w-0">
                <CodeExample code={coreCode} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="relative py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-neutral-900/80 via-neutral-900/50 to-neutral-950/80 border border-neutral-800/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-cyan-400/5" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-100 mb-4">
                Ready to build calendars?
              </h2>
              <p className="text-lg text-neutral-400 mb-8 max-w-xl mx-auto">
                Start building with GoBrand Calendar today. It is open source, lightweight, and built on the Temporal API.
              </p>

              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  to="/docs/$"
                  params={{ _splat: '' }}
                  className="group relative px-6 py-2.5 rounded-lg border border-sky-500/50 text-sky-400 hover:text-sky-300 hover:border-sky-400/60 font-medium transition-all duration-300"
                >
                  Documentation
                  <span className="ml-2 inline-block transition-transform group-hover:translate-x-0.5">-&gt;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-neutral-800/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-neutral-500">
            Built with precision. Open source under MIT.
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/go-brand/calendar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/@gobrand/calendar-core"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              npm
            </a>
          </div>
        </div>
      </footer>
    </HomeLayout>
  );
}
