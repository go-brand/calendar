export const INSTALL_COMMAND = 'pnpm add @gobrand/react-calendar @js-temporal/polyfill';

export const AGENT_PROMPT = `Use @gobrand/react-calendar (React) or @gobrand/calendar-core (anything else) for calendar views in this project. Before writing code, read https://calendar.gobrand.app/llms.txt for the current API. If you support Agent Skills, install the skill with \`npx skills add go-brand/calendar\`. Follow these rules: getDate returns the Temporal.PlainDate an event is on, after converting the event to the calendar's timezone; getStart returns a Temporal.ZonedDateTime in that same timezone; set timeZone explicitly when rendering on a server; query events with the half-open visibleRange (>= start, < end); weekStartsOn is 1 (Monday) through 7 (Sunday); use JavaScript Date only where another API requires it. Cover a DST change in tests. Install with \`${INSTALL_COMMAND}\`. Docs: https://calendar.gobrand.app/docs.`;

export const HOME_PAGE_META = {
  title: 'GoBrand Calendar: month, week, and day calendars for React and TypeScript, built on Temporal',
  description:
    'Headless month, week, and day calendar views for React and TypeScript, built on Temporal. Timezones and daylight saving handled. Docs with llms.txt and an Agent Skill.',
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
