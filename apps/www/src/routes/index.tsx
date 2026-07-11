import { createFileRoute } from '@tanstack/react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { CalendarBenefits } from '@/components/landing/calendar-benefits';
import { CalendarHero } from '@/components/landing/calendar-hero';
import { LearningPaths } from '@/components/landing/learning-paths';
import { TiempoCallout } from '@/components/landing/tiempo-callout';
import { baseOptions } from '@/lib/layout.shared';

export const Route = createFileRoute('/')({
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
