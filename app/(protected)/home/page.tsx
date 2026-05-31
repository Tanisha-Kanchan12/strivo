import { Focus, Hand, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GroupsSection } from "@/components/groups/groups-section";
import { HomeSidebar } from "@/components/home/home-sidebar";
import { HomeWidgetsSidebar } from "@/components/home/home-widgets-sidebar";
import { TodayPlannerWidget } from "@/components/planner/today-planner-widget";
import { LiveNowBanner } from "@/components/live-now/live-now-banner";
import { ProfileCompletionBanner } from "@/components/home/profile-completion-banner";
import { IncomingRequestsBanner } from "@/components/matches/incoming-requests-banner";
import { MatchFeed } from "@/components/matches/match-feed";
import { requireDbUser } from "@/lib/auth";
import { getAllExploreFilters, getRecommendedDiscoverChips } from "@/lib/constants/matching";
import { calculateProfileCompletion } from "@/lib/profile";
import prisma from "@/lib/prisma";

export default async function HomePage() {
  const { user } = await requireDbUser();

  const subjectsCount = await prisma.subject.count({
    where: { userId: user.id },
  });

  const completion = calculateProfileCompletion({
    profile: user.profile,
    subjectsCount,
  });

  const recommendedChips = [
    ...getRecommendedDiscoverChips(user.onboarding?.goal).map((chip) => ({
      id: chip.id,
      label: chip.label,
    })),
    { id: "MENTORS", label: "Mentors" },
  ];
  const allFilters = getAllExploreFilters().map((chip) => ({
    id: chip.id,
    label: chip.label,
  }));

  const firstName = user.name?.split(" ")[0];

  return (
    <div className="animate-fade-in">
      <div className="mb-8 surface-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-strivo-yellow/20 px-3 py-1 text-xs font-semibold text-strivo-text">
              <Sparkles className="h-3.5 w-3.5 text-primary-mid" />
              Discover partners
            </p>
            <h1 className="mt-3 flex items-center gap-2 text-2xl font-semibold tracking-tight text-strivo-text sm:text-3xl">
              {firstName ? (
                <>
                  Hey, {firstName}
                  <Hand className="float-soft h-7 w-7 text-strivo-yellow" aria-hidden />
                </>
              ) : (
                "Discover"
              )}
            </h1>
            <p className="mt-2 max-w-md text-sm text-strivo-secondary">
              Find serious students who match your goals and study schedule
            </p>
          </div>
          <Button asChild className="shrink-0 gap-2">
            <Link href="/focus">
              <Focus className="h-4 w-4" />
              Focus Room
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5 min-w-0">
          <TodayPlannerWidget />
          <GroupsSection />
          <LiveNowBanner />
          <ProfileCompletionBanner completion={completion} />
          <IncomingRequestsBanner />
          <MatchFeed
            initialRecommendedChips={recommendedChips}
            initialAllFilters={allFilters}
            currentUserId={user.id}
          />
        </div>

        <aside className="hidden lg:block">
          <div className="lg:sticky lg:top-20 space-y-4">
            <HomeWidgetsSidebar />
            <HomeSidebar />
          </div>
        </aside>
      </div>
    </div>
  );
}
