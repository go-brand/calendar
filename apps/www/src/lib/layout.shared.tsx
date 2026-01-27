import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex items-center gap-2">
          <span
            className="inline-block w-4 h-4 rounded"
            style={{
              background: 'linear-gradient(135deg, #0ea5e9, #22d3ee)',
            }}
          />
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
