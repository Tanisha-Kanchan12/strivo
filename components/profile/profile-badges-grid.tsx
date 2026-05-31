"use client";

import type { BadgeType } from "@prisma/client";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BADGE_INFO } from "@/lib/constants/onboarding";
import { cn } from "@/lib/utils";

const BADGE_STYLE: Record<
  BadgeType,
  { emoji: string; earnedClass: string; textClass: string }
> = {
  GOAL_SETTER: {
    emoji: "🎯",
    earnedClass: "bg-gradient-to-br from-[#F5C842] to-[#E8A820] shadow-badge",
    textClass: "text-strivo-text",
  },
  CONSISTENT: {
    emoji: "⚡",
    earnedClass: "bg-gradient-to-br from-[#8FBC45] to-[#4A7A1E] shadow-badge",
    textClass: "text-white",
  },
  GOOD_PARTNER: {
    emoji: "🤝",
    earnedClass: "bg-gradient-to-br from-[#3DBFB8] to-[#2A9A94] shadow-badge",
    textClass: "text-white",
  },
  VETERAN: {
    emoji: "🏆",
    earnedClass: "bg-gradient-to-br from-[#F5C842] to-[#FF9500] shadow-badge",
    textClass: "text-strivo-text",
  },
  PLANNER: {
    emoji: "📅",
    earnedClass: "bg-gradient-to-br from-[#8FBC45] to-[#2D4A0F] shadow-badge",
    textClass: "text-white",
  },
  VERIFIED_STUDENT: {
    emoji: "✅",
    earnedClass: "bg-gradient-to-br from-[#3DBFB8] to-[#2D4A0F] shadow-badge",
    textClass: "text-white",
  },
  COMMUNITY_BUILDER: {
    emoji: "🌱",
    earnedClass: "bg-gradient-to-br from-[#8FBC45] to-[#4A7A1E] shadow-badge",
    textClass: "text-white",
  },
};

interface ProfileBadgesGridProps {
  earnedTypes: BadgeType[];
  visibleByType: Partial<Record<BadgeType, boolean>>;
}

export function ProfileBadgesGrid({
  earnedTypes,
  visibleByType,
}: ProfileBadgesGridProps) {
  const earnedSet = new Set(earnedTypes);
  const allBadges = Object.keys(BADGE_INFO) as BadgeType[];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {allBadges.map((badgeType) => {
        const info = BADGE_INFO[badgeType];
        const style = BADGE_STYLE[badgeType];
        const isEarned = earnedSet.has(badgeType);

        return (
          <div
            key={badgeType}
            className={cn(
              "flex min-h-[148px] flex-col rounded-2xl p-5 transition-all",
              isEarned ? style.earnedClass : "bg-strivo-muted"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  "text-4xl leading-none",
                  !isEarned && "grayscale opacity-40"
                )}
                aria-hidden
              >
                {isEarned ? style.emoji : "🔒"}
              </span>
              {isEarned && visibleByType[badgeType] && (
                <Badge className="bg-white/25 text-white">Visible</Badge>
              )}
            </div>
            <div className="mt-auto pt-4">
              <div className="flex items-center gap-2">
                {!isEarned && (
                  <Lock className="h-4 w-4 shrink-0 text-strivo-secondary" />
                )}
                <p
                  className={cn(
                    "font-bold",
                    isEarned ? style.textClass : "text-strivo-secondary"
                  )}
                >
                  {info.label}
                </p>
              </div>
              <p
                className={cn(
                  "mt-1.5 text-sm leading-snug font-medium",
                  isEarned
                    ? cn(style.textClass, style.textClass === "text-white" && "opacity-95")
                    : "text-strivo-secondary"
                )}
              >
                {isEarned ? info.description : info.unlock}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
