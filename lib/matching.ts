import type { PartnerType, StudyGoal, StudyTime } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  computeAvailabilityScore,
  computeGoalScore,
  computeStyleScore,
  chipMatchesCandidate,
  getGoalsForFilterChip,
  matchesSearchQuery,
  type FilterChipId,
} from "@/lib/constants/matching";
import {
  matchesCustomFilterLabel,
  parseCustomFilterId,
} from "@/lib/custom-filters";
import { formatStudyGoal } from "@/lib/constants/onboarding";
import { asStudyTimes } from "@/lib/prisma-json";
import { generateMatchReasonText } from "@/lib/ai/match-reason";

export interface MatchCandidate {
  id: string;
  name: string | null;
  city: string | null;
  college: string | null;
  stream: string | null;
  profilePicUrl: string | null;
  goal: StudyGoal | null;
  field: string | null;
  studyTimes: StudyTime[];
  partnerType: PartnerType | null;
  subjects: string[];
  bio: string | null;
  isLiveNow: boolean;
  matchScore: number;
  reasonText: string;
  requestStatus: "none" | "sent" | "received";
  pairRequestId: string | null;
  isMentor?: boolean;
  achievementBadge?: string | null;
}

export async function getExcludedUserIds(userId: string): Promise<Set<string>> {
  const [
    connectedPairs,
    skippedMatches,
    blocksInitiated,
    blocksReceived,
    sentRequests,
  ] = await Promise.all([
    prisma.connectedPair.findMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      select: { user1Id: true, user2Id: true },
    }),
    prisma.match.findMany({
      where: { userId, status: "SKIPPED" },
      select: { matchedUserId: true },
    }),
    prisma.block.findMany({
      where: { blockerId: userId },
      select: { blockedId: true },
    }),
    prisma.block.findMany({
      where: { blockedId: userId },
      select: { blockerId: true },
    }),
    prisma.pairRequest.findMany({
      where: {
        senderId: userId,
        status: { in: ["PENDING", "ACCEPTED"] },
      },
      select: { receiverId: true },
    }),
  ]);

  const excluded = new Set<string>([userId]);

  connectedPairs.forEach((p) => {
    excluded.add(p.user1Id === userId ? p.user2Id : p.user1Id);
  });
  skippedMatches.forEach((m) => excluded.add(m.matchedUserId));
  blocksInitiated.forEach((b) => excluded.add(b.blockedId));
  blocksReceived.forEach((b) => excluded.add(b.blockerId));
  sentRequests.forEach((r) => excluded.add(r.receiverId));

  return excluded;
}

export async function getMatchesForUser(
  userId: string,
  filterChip: FilterChipId | string = "ALL",
  searchQuery?: string
): Promise<MatchCandidate[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      onboarding: true,
      settings: true,
      subjects: true,
    },
  });

  if (!user?.onboarding?.completedAt) return [];

  const excluded = await getExcludedUserIds(userId);

  const customFilterDbId = parseCustomFilterId(String(filterChip));
  let customFilterLabel: string | null = null;
  if (customFilterDbId) {
    const custom = await prisma.userCustomFilter.findFirst({
      where: { id: customFilterDbId, userId },
    });
    customFilterLabel = custom?.label ?? null;
  }

  const filterGoals =
    filterChip === "ALL" ||
    filterChip === "MENTORS" ||
    customFilterLabel
      ? null
      : getGoalsForFilterChip(filterChip as FilterChipId);

  const candidates = await prisma.user.findMany({
    where: {
      id: { notIn: Array.from(excluded) },
      onboarding: {
        completedAt: { not: null },
        ...(filterGoals && filterGoals.length > 0
          ? { goal: { in: filterGoals } }
          : {}),
      },
      ...(filterChip === "MENTORS"
        ? { mentorProfile: { isMentor: true } }
        : {}),
      profile: {
        visibility: { not: "PRIVATE" },
        ...(user.settings?.cityMode && user.profile?.city
          ? { city: user.profile.city }
          : {}),
      },
    },
    include: {
      profile: true,
      onboarding: true,
      settings: true,
      subjects: true,
      liveNowSessions: {
        where: { isActive: true, autoExpiresAt: { gt: new Date() } },
        take: 1,
      },
      mentorProfile: true,
    },
    take: 100,
  });

  const pendingSent = await prisma.pairRequest.findMany({
    where: { senderId: userId, status: "PENDING" },
    select: { id: true, receiverId: true },
  });
  const sentMap = new Map(pendingSent.map((r) => [r.receiverId, r.id]));

  const pendingReceived = await prisma.pairRequest.findMany({
    where: { receiverId: userId, status: "PENDING" },
    select: { id: true, senderId: true },
  });
  const receivedMap = new Map(pendingReceived.map((r) => [r.senderId, r.id]));

  const userTimes = asStudyTimes(user.onboarding.studyTimes).map(String);
  const userGoal = user.onboarding.goal;
  const userStyle = user.onboarding.partnerType;
  const userGirlsOnly = user.settings?.girlsOnlyMode ?? false;

  const scored: MatchCandidate[] = [];

  for (const candidate of candidates) {
    if (userGirlsOnly && !candidate.settings?.girlsOnlyMode) continue;
    if (!userGirlsOnly && candidate.settings?.girlsOnlyMode) continue;

    const candidateGoal = candidate.onboarding?.goal ?? null;
    const candidateTimes = asStudyTimes(candidate.onboarding?.studyTimes).map(String);
    const candidateStyle = candidate.onboarding?.partnerType ?? null;

    const goalScore = computeGoalScore(userGoal, candidateGoal);
    const availabilityScore = computeAvailabilityScore(userTimes, candidateTimes);
    const styleScore = computeStyleScore(userStyle, candidateStyle);
    const matchScore = Math.round(goalScore + availabilityScore + styleScore);

    if (matchScore <= 0) continue;

    if (customFilterLabel) {
      if (
        !matchesCustomFilterLabel(customFilterLabel, {
          goal: candidateGoal,
          field: candidate.onboarding?.field ?? null,
          subjects: candidate.subjects.map((s) => s.subjectName),
          name: candidate.name,
          college: candidate.profile?.college ?? null,
          stream: candidate.profile?.stream ?? null,
          bio: candidate.profile?.bio ?? null,
        })
      ) {
        continue;
      }
    } else if (
      filterChip !== "ALL" &&
      filterChip !== "HACKATHON" &&
      filterChip !== "MENTORS"
    ) {
      if (
        !chipMatchesCandidate(filterChip as FilterChipId, {
          goal: candidateGoal,
          field: candidate.onboarding?.field ?? null,
          subjects: candidate.subjects.map((s) => s.subjectName),
          name: candidate.name,
          college: candidate.profile?.college ?? null,
          stream: candidate.profile?.stream ?? null,
        })
      ) {
        continue;
      }
    }

    if (
      searchQuery &&
      !matchesSearchQuery(searchQuery, {
        goal: candidateGoal,
        field: candidate.onboarding?.field ?? null,
        subjects: candidate.subjects.map((s) => s.subjectName),
        name: candidate.name,
        college: candidate.profile?.college ?? null,
        stream: candidate.profile?.stream ?? null,
      }) &&
      !formatStudyGoal(candidateGoal ?? "OTHER")
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase())
    ) {
      continue;
    }

    let reasonText: string | null = null;
    const cached = await prisma.match.findUnique({
      where: {
        userId_matchedUserId: { userId, matchedUserId: candidate.id },
      },
    });

    if (cached?.reasonText) {
      reasonText = cached.reasonText;
    } else {
      reasonText = await generateMatchReasonText(
        {
          name: user.name,
          goal: userGoal,
          field: user.onboarding?.field ?? null,
          studyTimes: asStudyTimes(user.onboarding?.studyTimes),
          partnerType: userStyle,
          city: user.profile?.city ?? null,
          college: user.profile?.college ?? null,
        },
        {
          name: candidate.name,
          goal: candidateGoal,
          field: candidate.onboarding?.field ?? null,
          studyTimes: asStudyTimes(candidate.onboarding?.studyTimes),
          partnerType: candidateStyle,
          city: candidate.profile?.city ?? null,
          college: candidate.profile?.college ?? null,
        },
        matchScore
      );

      await prisma.match.upsert({
        where: {
          userId_matchedUserId: { userId, matchedUserId: candidate.id },
        },
        create: {
          userId,
          matchedUserId: candidate.id,
          matchScore,
          reasonText,
          status: "PENDING",
        },
        update: { matchScore, reasonText },
      });
    }

    const sentId = sentMap.get(candidate.id);
    const receivedId = receivedMap.get(candidate.id);

    scored.push({
      id: candidate.id,
      name: candidate.name,
      city: candidate.profile?.city ?? null,
      college: candidate.profile?.college ?? null,
      stream: candidate.profile?.stream ?? candidate.onboarding?.field ?? null,
      profilePicUrl: candidate.profile?.profilePicUrl ?? null,
      goal: candidateGoal,
      field: candidate.onboarding?.field ?? null,
      studyTimes: asStudyTimes(candidate.onboarding?.studyTimes),
      partnerType: candidateStyle,
      subjects: candidate.subjects.map((s) => s.subjectName),
      bio: candidate.profile?.bio ?? null,
      isLiveNow: candidate.liveNowSessions.length > 0,
      matchScore,
      reasonText: reasonText ?? "",
      requestStatus: sentId ? "sent" : receivedId ? "received" : "none",
      pairRequestId: sentId ?? receivedId ?? null,
      isMentor: candidate.mentorProfile?.isMentor ?? false,
      achievementBadge: candidate.mentorProfile?.achievementBadge ?? null,
    });
  }

  scored.sort((a, b) => b.matchScore - a.matchScore);
  return scored.slice(0, 20);
}

export async function createConnectedPair(
  user1Id: string,
  user2Id: string,
  options?: {
    source?: "MATCH" | "LIVE_NOW" | "HACKATHON";
    isProvisional?: boolean;
    withStreak?: boolean;
  }
) {
  const [sorted1, sorted2] = [user1Id, user2Id].sort();
  const withStreak = options?.withStreak ?? !options?.isProvisional;

  const existing = await prisma.connectedPair.findFirst({
    where: {
      OR: [
        { user1Id: sorted1, user2Id: sorted2 },
        { user1Id: sorted2, user2Id: sorted1 },
      ],
    },
  });

  if (existing) return existing;

  return prisma.connectedPair.create({
    data: {
      user1Id: sorted1,
      user2Id: sorted2,
      source: options?.source ?? "MATCH",
      isProvisional: options?.isProvisional ?? false,
      ...(withStreak
        ? { pairStreak: { create: { shieldsRemaining: 2 } } }
        : {}),
    },
  });
}
