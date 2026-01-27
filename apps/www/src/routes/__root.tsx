import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import * as React from 'react';
import appCss from '@/styles/app.css?url';
import { RootProvider } from 'fumadocs-ui/provider/tanstack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'GoBrand Calendar - Build calendars with Temporal API',
      },
      {
        name: 'description',
        content: 'A lightweight TypeScript library for building calendars using the Temporal API. Multi-view support, timezone-aware, fully type-safe.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/calendar/favicon.svg' },
      { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/calendar/favicon-96x96.png' },
      { rel: 'shortcut icon', href: '/calendar/favicon.ico' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/calendar/apple-touch-icon.png' },
      { rel: 'manifest', href: '/calendar/site.webmanifest' },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    // Force dark theme by adding dark class and disabling theme switching
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="flex flex-col min-h-screen">
        {/*
          Theme configuration:
          - forcedTheme="dark": Forces dark theme, ignoring user preference
          - disableTransitionOnChange: Prevents flash when page loads
          - enableSystem={false}: Disables system preference detection
          - attribute="class": Uses class-based theming (Tailwind compatible)
        */}
        <QueryClientProvider client={queryClient}>
          <RootProvider
            theme={{
              forcedTheme: 'dark',
              disableTransitionOnChange: true,
              enableSystem: false,
              attribute: 'class',
            }}
            search={{
              options: {
                api: '/calendar/api/search',
              },
            }}
          >
            {children}
          </RootProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
