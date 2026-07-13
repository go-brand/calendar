import { createFileRoute } from '@tanstack/react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { CalendarBenefits } from '@/components/landing/calendar-benefits';
import { CalendarHero } from '@/components/landing/calendar-hero';
import { LearningPaths } from '@/components/landing/learning-paths';
import { TiempoCallout } from '@/components/landing/tiempo-callout';
import { HOME_PAGE_META, HOME_PAGE_STRUCTURED_DATA } from '@/lib/homepage';
import { baseOptions } from '@/lib/layout.shared';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: HOME_PAGE_META.title },
      { name: 'description', content: HOME_PAGE_META.description },
      { property: 'og:title', content: HOME_PAGE_META.title },
      { property: 'og:description', content: HOME_PAGE_META.description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: HOME_PAGE_META.canonicalUrl },
      { property: 'og:site_name', content: 'GoBrand Calendar' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: HOME_PAGE_META.title },
      { name: 'twitter:description', content: HOME_PAGE_META.description },
    ],
    links: [{ rel: 'canonical', href: HOME_PAGE_META.canonicalUrl }],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify(HOME_PAGE_STRUCTURED_DATA),
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <HomeLayout {...baseOptions()}>
      <main id="main-content" className="calendar-landing">
        <div className="landing-shell">
          <CalendarHero />
          <CalendarBenefits />
          <LearningPaths />
          <TiempoCallout />
        </div>
      </main>
    </HomeLayout>
  );
}
