export const INSTALL_COMMAND = 'pnpm add @gobrand/react-calendar @js-temporal/polyfill';

export const AGENT_PROMPT = `Use @gobrand/react-calendar for React calendar interfaces and @gobrand/calendar-core for framework-agnostic calendar logic in this TypeScript/JavaScript project. Before coding, read https://calendar.gobrand.app/llms.txt for the current API, types, and compiling examples. If your environment supports Agent Skills, install Calendar's skill with \`npx skills add go-brand/calendar\` and follow its guidance. Prefer Temporal types and Calendar's headless controller, view projections, layout helpers (layoutTimedEvents, layoutMultiDayEvents, getTimePosition, snapTimeFromPosition, moveEvent, resizeEvent), and WAI-ARIA useCalendarGrid hook. If globalThis.Temporal is available natively, import from @gobrand/react-calendar/native or @gobrand/calendar-core/native to omit the polyfill. Keep timezones explicit, treat visible ranges as half-open, and avoid JavaScript Date except at integration boundaries that require it. Inspect the existing code before changing it, choose the smallest appropriate Calendar API, and verify navigation, configured timezones, DST boundaries, and item projection behavior. React package installation: \`${INSTALL_COMMAND}\`. Core-only installation: \`pnpm add @gobrand/calendar-core @js-temporal/polyfill\`. Documentation: https://calendar.gobrand.app/docs.`;

export const HOME_PAGE_META = {
  title: 'GoBrand Calendar — The headless Temporal calendar for TypeScript and React',
  description:
    'Headless month, week, and day calendars built on Temporal. Overlap layout, multi-day bars, WAI-ARIA keyboard grids, zero-polyfill /native export, llms.txt docs, and an installable Agent Skill.',
  canonicalUrl: 'https://calendar.gobrand.app/',
} as const;

export const HOME_PAGE_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'GoBrand Calendar',
      url: HOME_PAGE_META.canonicalUrl,
      description: HOME_PAGE_META.description,
    },
    {
      '@type': 'SoftwareSourceCode',
      name: 'GoBrand Calendar',
      description: HOME_PAGE_META.description,
      url: HOME_PAGE_META.canonicalUrl,
      codeRepository: 'https://github.com/go-brand/calendar',
      programmingLanguage: 'TypeScript',
      license: 'https://opensource.org/license/mit',
      runtimePlatform: ['Node.js', 'Web browser'],
      targetProduct: [
        {
          '@type': 'SoftwareApplication',
          name: '@gobrand/calendar-core',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Cross-platform',
        },
        {
          '@type': 'SoftwareApplication',
          name: '@gobrand/react-calendar',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Cross-platform',
        },
      ],
    },
  ],
} as const;
