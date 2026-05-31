import { NextResponse } from "next/server";
import {
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { formatStudyGoal } from "@/lib/constants/onboarding";
import { getMatchesForUser } from "@/lib/matching";
import prisma from "@/lib/prisma";

const TRENDING_BY_GOAL: Record<string, string[]> = {
  JEE: ["Rotational Motion", "Organic Chemistry", "Integration tricks"],
  NEET: ["Human Physiology", "Genetics", "Thermodynamics"],
  CAT: ["RC speed reading", "Set theory", "Para jumbles"],
  UPSC: ["Polity amendments", "Map-based Geography", "Economy budget"],
  GATE: ["Operating Systems", "Digital Logic", "Engineering Maths"],
  PLACEMENT_PREP: ["Two pointers", "Dynamic Programming", "System Design basics"],
  PRODUCT_MANAGEMENT: ["Metrics frameworks", "PRD writing", "User research"],
  CONSULTING: ["Profitability cases", "Market entry", "Guesstimates"],
};

export async function GET() {
  try {
    const { user } = await requireDbUser();
    const goal = user.onboarding?.goal;

    const [streak, streakLeaderboard, suggested] = await Promise.all([
      prisma.individualStreak.findUnique({ where: { userId: user.id } }),
      prisma.individualStreak.findMany({
        include: {
          user: { include: { profile: true, onboarding: true } },
        },
        orderBy: { currentStreak: "desc" },
        take: 10,
      }),
      getMatchesForUser(user.id, "ALL").then((m) => m.slice(0, 4)),
    ]);

    const filteredLeaderboard = goal
      ? streakLeaderboard.filter((s) => s.user.onboarding?.goal === goal)
      : streakLeaderboard;

    const leaderboard =
      filteredLeaderboard.length > 0 ? filteredLeaderboard : streakLeaderboard;

    const trending =
      (goal && TRENDING_BY_GOAL[goal]) ??
      ["Daily revision", "Mock tests", "Concept notes"];

    return NextResponse.json({
      streak: {
        current: streak?.currentStreak ?? 0,
        longest: streak?.longestStreak ?? 0,
      },
      leaderboard: leaderboard.map((s, i) => ({
        rank: i + 1,
        name: s.user.name,
        streak: s.currentStreak,
        profilePicUrl: s.user.profile?.profilePicUrl ?? null,
        goalLabel: s.user.onboarding?.goal
          ? formatStudyGoal(s.user.onboarding.goal)
          : null,
      })),
      suggestedConnections: suggested.map((m) => ({
        id: m.id,
        name: m.name,
        goalLabel: m.goal ? formatStudyGoal(m.goal) : null,
        profilePicUrl: m.profilePicUrl,
        matchScore: m.matchScore,
      })),
      trendingTopics: trending.map((topic) => ({
        topic,
        goalLabel: goal ? formatStudyGoal(goal) : "Study",
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/home/widgets error:", error);
    return serverErrorResponse();
  }
}
