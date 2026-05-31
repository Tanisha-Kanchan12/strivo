import Link from "next/link";
import { ActivityCalendar } from "@/components/profile/activity-calendar";
import { AvailabilitySection } from "@/components/profile/availability-section";
import { ProfileBadgesGrid } from "@/components/profile/profile-badges-grid";
import { ReferFriendSection } from "@/components/profile/refer-friend-section";
import { StudyGoalsSection } from "@/components/profile/study-goals-section";
import { getSoloFocusStats } from "@/lib/activity";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { requireDbUser } from "@/lib/auth";
import {
  formatPartnerType,
  formatStudyGoal,
  formatStudyTimes,
} from "@/lib/constants/onboarding";
import { calculateProfileCompletion } from "@/lib/profile";
import { asStudyTimes } from "@/lib/prisma-json";
import prisma from "@/lib/prisma";
import { getInitials } from "@/lib/utils";
import { BadgeType } from "@prisma/client";
import { BadgeCheck, Pencil, Settings, Sparkles } from "lucide-react";

export default async function ProfilePage() {
  const { user } = await requireDbUser();

  const [subjects, badges, pairsCount, sessionsCount, soloStats] = await Promise.all([
    prisma.subject.findMany({
      where: { userId: user.id },
      orderBy: { subjectName: "asc" },
    }),
    prisma.badge.findMany({ where: { userId: user.id } }),
    prisma.connectedPair.count({
      where: {
        OR: [{ user1Id: user.id }, { user2Id: user.id }],
      },
    }),
    prisma.focusSession.count({
      where: {
        OR: [{ user1Id: user.id }, { user2Id: user.id }],
        isComplete: true,
        user2Id: { not: null },
      },
    }),
    getSoloFocusStats(user.id),
  ]);

  const completion = calculateProfileCompletion({
    profile: user.profile,
    subjectsCount: subjects.length,
  });

  const earnedBadgeTypes = badges.map((b) => b.badgeType);
  const visibleByType = Object.fromEntries(
    badges.map((b) => [b.badgeType, b.isVisible])
  ) as Partial<Record<BadgeType, boolean>>;

  const streak = user.individualStreak?.currentStreak ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-primary/25">
            {user.profile?.profilePicUrl && (
              <AvatarImage src={user.profile.profilePicUrl} alt={user.name ?? ""} />
            )}
            <AvatarFallback className="bg-primary/15 text-lg text-primary">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-strivo-text">
                {user.name ?? "Your Profile"}
              </h1>
              {user.profile?.isVerified && (
                <BadgeCheck className="h-5 w-5 text-strivo-teal" />
              )}
            </div>
            <p className="text-strivo-secondary">
              {[user.profile?.city, user.profile?.college]
                .filter(Boolean)
                .join(" · ") || "Complete your profile"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile/edit">
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {completion < 100 && (
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex-1 space-y-3">
              <p className="text-sm font-bold text-primary">
                Profile {completion}% complete
              </p>
              <Progress value={completion} />
            </div>
            <Button size="sm" asChild>
              <Link href="/profile/edit">Complete</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="text-center">
          <CardContent className="p-5">
            <p className="text-2xl font-bold text-primary">
              {streak > 0 && <span className="mr-1" aria-hidden>🔥</span>}
              {streak}
            </p>
            <p className="text-sm font-semibold text-strivo-secondary">Day streak</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-5">
            <p className="text-2xl font-bold text-primary">{pairsCount}</p>
            <p className="text-sm font-semibold text-strivo-secondary">Active pairs</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-5">
            <p className="text-2xl font-bold text-primary">{sessionsCount}</p>
            <p className="text-sm font-semibold text-strivo-secondary">Pair sessions</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-5">
            <p className="text-2xl font-bold text-primary">{soloStats.soloSessionCount}</p>
            <p className="text-sm font-semibold text-strivo-secondary">Solo sessions</p>
            <p className="mt-1 text-xs text-strivo-secondary">
              {soloStats.soloTotalHours}h focus time
            </p>
          </CardContent>
        </Card>
      </div>

      <ActivityCalendar />
      <StudyGoalsSection />
      <AvailabilitySection />
      <ReferFriendSection userId={user.id} />

      <Card>
        <CardHeader>
          <CardTitle>Study info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-strivo-secondary">Goal</span>
            <span className="font-medium text-strivo-text">
              {formatStudyGoal(user.onboarding?.goal)}
            </span>
          </div>
          {user.onboarding?.field && (
            <div className="flex justify-between">
              <span className="text-strivo-secondary">Field</span>
              <span className="font-medium">{user.onboarding.field}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-strivo-secondary">Study times</span>
            <span className="text-right font-medium">
              {formatStudyTimes(asStudyTimes(user.onboarding?.studyTimes))}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-strivo-secondary">Partner type</span>
            <span className="font-medium">
              {formatPartnerType(user.onboarding?.partnerType)}
            </span>
          </div>
          {subjects.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-strivo-secondary">Subjects</span>
              <div className="flex flex-wrap gap-2">
                {subjects.map((s) => (
                  <Badge key={s.id} variant="default">
                    {s.subjectName}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {user.profile?.bio && (
            <div className="space-y-1 pt-1">
              <span className="text-strivo-secondary">Bio</span>
              <p className="text-strivo-text">{user.profile.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Monthly Recap
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile/recap">View recap</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-strivo-secondary">
            End-of-month stats and a shareable recap card, generated automatically.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileBadgesGrid
            earnedTypes={earnedBadgeTypes}
            visibleByType={visibleByType}
          />
        </CardContent>
      </Card>
    </div>
  );
}
