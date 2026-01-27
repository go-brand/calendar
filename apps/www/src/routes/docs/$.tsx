import { createFileRoute, notFound } from '@tanstack/react-router';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { createServerFn } from '@tanstack/react-start';
import { source } from '@/lib/source';
import browserCollections from 'fumadocs-mdx:collections/browser';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { baseOptions } from '@/lib/layout.shared';
import { useFumadocsLoader } from 'fumadocs-core/source/client';
import { Suspense } from 'react';
import { Preview } from '@/components/preview';
import { BasicMonthPreview } from '@/components/examples/basic-month';
import { SimpleWeekViewPreview, WeekViewWithSlotsPreview } from '@/components/examples/week-view';
import { DayViewPreview } from '@/components/examples/day-view';
import { MultiViewPreview } from '@/components/examples/multi-view';

export const Route = createFileRoute('/docs/$')({
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split('/') ?? [];
    const data = await serverLoader({ data: slugs });
    await clientLoader.preload(data.path);
    return data;
  },
});

const serverLoader = createServerFn({
  method: 'GET',
})
  .inputValidator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs);
    if (!page) throw notFound();

    return {
      path: page.path,
      pageTree: await source.serializePageTree(source.getPageTree()),
    };
  });

const clientLoader = browserCollections.docs.createClientLoader({
  component(
    { toc, frontmatter, default: MDX },
    // you can define props for the component
    props: {
      className?: string;
    },
  ) {
    return (
      <DocsPage toc={toc} {...props}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <DocsBody>
          <MDX
            components={{
              ...defaultMdxComponents,
              Preview,
              BasicMonthPreview,
              SimpleWeekViewPreview,
              WeekViewWithSlotsPreview,
              DayViewPreview,
              MultiViewPreview,
            }}
          />
        </DocsBody>
      </DocsPage>
    );
  },
});

function Page() {
  const data = useFumadocsLoader(Route.useLoaderData());
  const base = baseOptions();

  return (
    <DocsLayout
      {...base}
      tree={data.pageTree}
      // Override links to exclude navbar items from docs sidebar
      // Only show icon-type links (like GitHub) in docs top bar
      links={[]}
      sidebar={{
        tabs: {
          transform(option, node) {
            return option;
          },
        },
      }}
    >
      <Suspense>
        {clientLoader.useContent(data.path, {
          className: '',
        })}
      </Suspense>
    </DocsLayout>
  );
}
