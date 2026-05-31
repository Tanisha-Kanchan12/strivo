import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireDbUser } from "@/lib/auth";
import { asStudyTimes } from "@/lib/prisma-json";
import {
  formatPartnerType,
  formatStudyGoal,
  formatStudyTimes,
} from "@/lib/constants/onboarding";
import prisma from "@/lib/prisma";
import { getInitials } from "@/lib/utils";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { user: viewer } = await requireDbUser();
  const { userId } = await params;

  if (userId === viewer.id) {
    notFound();
  }

  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: viewer.id, blockedId: userId },
        { blockerId: userId, blockedId: viewer.id },
      ],
    },
  });

  if (block) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-strivo-secondary">This profile is not available.</p>
        <Button variant="link" asChild className="mt-4">
          <Link href="/home">Back to Discover</Link>
        </Button>
      </div>
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      onboarding: true,
      subjects: true,
      badges: { where: { isVisible: true } },
    },
  });

  if (!target) notFound();

  const visibility = target.profile?.visibility ?? "OPEN";

  if (visibility === "PRIVATE") {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-strivo-secondary">This profile is private.</p>
        <Button variant="link" asChild className="mt-4">
          <Link href="/home">Back to Discover</Link>
        </Button>
      </div>
    );
  }

  const isConnected = await prisma.connectedPair.findFirst({
    where: {
      OR: [
        { user1Id: viewer.id, user2Id: userId },
        { user1Id: userId, user2Id: viewer.id },
      ],
    },
  });

  const limited = visibility === "MATCH_ONLY" && !isConnected;

  const pairsCount = await prisma.connectedPair.count({
    where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/home">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </Button>

      <div className="flex items-center gap-4">
        {!limited && (
          <Avatar className="h-16 w-16">
            {target.profile?.profilePicUrl && (
              <AvatarImage
                src={target.profile.profilePicUrl}
                alt={target.name ?? ""}
              />
            )}
            <AvatarFallback className="text-lg">
              {getInitials(target.name)}
            </AvatarFallback>
          </Avatar>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">
              {target.name ?? "Student"}
            </h1>
            {!limited && target.profile?.isVerified && (
              <BadgeCheck className="h-5 w-5 text-strivo-secondary" />
            )}
          </div>
          {!limited && target.profile?.city && (
            <p className="flex items-center gap-1 text-strivo-secondary">
              <MapPin className="h-4 w-4" />
              {target.profile.city}
            </p>
          )}
          {target.onboarding?.goal && (
            <Badge variant="secondary" className="mt-2">
              {formatStudyGoal(target.onboarding.goal)}
            </Badge>
          )}
        </div>
      </div>

      {limited ? (
        <Card>
          <CardContent className="py-8 text-center text-strivo-secondary">
            Connect with this person to see their full profile
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-semibold">{pairsCount}</p>
                <p className="text-sm text-strivo-secondary">Active pairs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm font-medium">
                  {target.profile?.college ?? "Not set"}
                </p>
                <p className="text-sm text-strivo-secondary">College</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Study info</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {target.profile?.stream && (
                <div className="flex justify-between">
                  <span className="text-strivo-secondary">Stream</span>
                  <span>{target.profile.stream}</span>
                </div>
              )}
              {asStudyTimes(target.onboarding?.studyTimes).length > 0 && (
                <div className="flex justify-between">
                  <span className="text-strivo-secondary">Study times</span>
                  <span>{formatStudyTimes(asStudyTimes(target.onboarding?.studyTimes))}</span>
                </div>
              )}
              {target.onboarding?.partnerType && (
                <div className="flex justify-between">
                  <span className="text-strivo-secondary">Partner type</span>
                  <span>{formatPartnerType(target.onboarding.partnerType)}</span>
                </div>
              )}
              {target.subjects.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {target.subjects.map((s) => (
                    <Badge key={s.id} variant="secondary">
                      {s.subjectName}
                    </Badge>
                  ))}
                </div>
              )}
              {target.profile?.bio && (
                <p className="pt-2 text-strivo-secondary">{target.profile.bio}</p>
              )}
            </CardContent>
          </Card>

          {target.badges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {target.badges.map((b) => (
                  <Badge key={b.id} variant="secondary">
                    {b.badgeType.replace(/_/g, " ")}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
