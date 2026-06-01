"use client";

import { MapPin, Radio, Sparkles } from "lucide-react";
import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatStudyGoal, formatStudyTimes } from "@/lib/constants/onboarding";
import type { MatchCandidate } from "@/lib/matching";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface MatchCardProps {
  match: MatchCandidate;
  onSkip: (id: string) => void;
  onConnect: (id: string) => void;
  onOpen: (match: MatchCandidate) => void;
  isSkipping?: boolean;
  isConnecting?: boolean;
  className?: string;
}

export const MatchCard = memo(function MatchCard({
  match,
  onSkip,
  onConnect,
  onOpen,
  isSkipping,
  isConnecting,
  className,
}: MatchCardProps) {
  const isSent = match.requestStatus === "sent";

  return (
    <Card
      className={cn(
        "surface-card-hover cursor-pointer overflow-hidden",
        isSkipping && "pointer-events-none scale-95 opacity-0 transition-all duration-300",
        className
      )}
      onClick={() => onOpen(match)}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 shrink-0">
            {match.profilePicUrl && (
              <AvatarImage src={match.profilePicUrl} alt={match.name ?? ""} />
            )}
            <AvatarFallback>{getInitials(match.name)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-strivo-text">
                  {match.name ?? "Student"}
                </h3>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-strivo-secondary">
                  {match.city && (
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" />
                      {match.city}
                    </span>
                  )}
                  {(match.college || match.stream) && (
                    <span>{match.college ?? match.stream}</span>
                  )}
                </div>
              </div>
              <div className="rounded-2xl bg-strivo-muted px-3 py-1 text-right">
                <p className="text-lg font-bold text-primary">
                  {match.matchScore}%
                </p>
                <p className="text-xs text-strivo-secondary">match</p>
              </div>
            </div>

            {match.isLiveNow && (
              <Badge variant="teal" className="mt-3 gap-1">
                <Radio className="h-3 w-3 animate-pulse-soft text-strivo-teal" />
                Live Now
              </Badge>
            )}

            <p className="mt-3 line-clamp-2 text-sm text-strivo-secondary">
              <Sparkles className="mr-1 inline h-3.5 w-3.5 text-primary-mid" />
              {match.reasonText}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {match.goal && (
                <Badge variant="secondary" className="text-xs">
                  {formatStudyGoal(match.goal)}
                </Badge>
              )}
              {match.isMentor && match.achievementBadge && (
                <Badge variant="teal" className="text-xs">
                  {match.achievementBadge}
                </Badge>
              )}
              {match.studyTimes.slice(0, 2).map((time) => (
                <Badge key={time} variant="outline" className="text-xs">
                  {formatStudyTimes([time])}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div
          className="mt-5 flex gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => onSkip(match.id)}
            disabled={isSkipping || isSent}
            loading={isSkipping}
          >
            Skip
          </Button>
          <Button
            className="flex-1"
            onClick={() => onConnect(match.id)}
            disabled={isConnecting || isSent}
            loading={isConnecting}
            variant={isSent ? "secondary" : "default"}
          >
            {isSent ? "Pending" : "Connect"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
