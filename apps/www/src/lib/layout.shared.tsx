import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-grid h-5 w-7 place-items-center rounded border border-cyan-300/40 bg-cyan-300/10 font-mono text-[10px] font-semibold tracking-[-0.15em] text-cyan-200"
          >
            [ )
          </span>
          GoBrand Calendar
        </span>
      ),
    },
    githubUrl: 'https://github.com/go-brand/calendar',
    links: [
      {
        text: 'Documentation',
        url: '/docs',
      },
    ],
    // Disable theme toggle since we're forcing dark theme only
    themeSwitch: {
      enabled: false,
    },
  };
}
