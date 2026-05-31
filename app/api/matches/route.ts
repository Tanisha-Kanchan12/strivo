import { NextResponse } from "next/server";
import type { FilterChipId } from "@/lib/constants/matching";
import {
  getAllExploreFilters,
  getRecommendedDiscoverChips,
} from "@/lib/constants/matching";
import {
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { customFilterId } from "@/lib/custom-filters";
import { getMatchesForUser } from "@/lib/matching";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { user } = await requireDbUser();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") ?? "ALL";

    const goal = user.onboarding?.goal;

    const [matches, recommendedChips, allFilters, customFilters] =
      await Promise.all([
        getMatchesForUser(user.id, filter),
        Promise.resolve(getRecommendedDiscoverChips(goal)),
        Promise.resolve(getAllExploreFilters()),
        prisma.userCustomFilter.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "asc" },
        }),
      ]);

    return NextResponse.json({
      matches,
      recommendedChips: recommendedChips.map((c) => ({ id: c.id, label: c.label })),
      allFilters: allFilters.map((c) => ({ id: c.id, label: c.label })),
      customFilters: customFilters.map((f) => ({
        id: customFilterId(f.id),
        label: f.label,
      })),
      activeFilter: filter,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/matches error:", error);
    return serverErrorResponse();
  }
}
