"use client";

import { MapPin, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatPartnerType,
  formatStudyGoal,
  formatStudyTimes,
} from "@/lib/constants/onboarding";
import type { MatchCandidate } from "@/lib/matching";
import { getInitials } from "@/lib/utils";

interface ProfilePreviewModalProps {
  match: MatchCandidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSkip: (id: string) => void;
  onConnect: (id: string) => void;
  isConnecting?: boolean;
}

export function ProfilePreviewModal({
  match,
  open,
  onOpenChange,
  onSkip,
  onConnect,
  isConnecting,
}: ProfilePreviewModalProps) {
  const [requestingMentor, setRequestingMentor] = useState(false);

  if (!match) return null;

  const isSent = match.requestStatus === "sent";

  async function requestMentorSession() {
    if (!match) return;
    const mentorId = match.id;
    setRequestingMentor(true);
    try {
      const res = await fetch("/api/mentors/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Mentor session request sent!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Request failed");
    } finally {
      setRequestingMentor(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Profile preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {match.profilePicUrl && (
                <AvatarImage src={match.profilePicUrl} alt={match.name ?? ""} />
              )}
              <AvatarFallback className="text-lg">
                {getInitials(match.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{match.name ?? "Student"}</h2>
              {match.city && (
                <p className="flex items-center gap-1 text-sm text-strivo-secondary">
                  <MapPin className="h-3.5 w-3.5" />
                  {match.city}
                </p>
              )}
              <p className="text-sm font-medium text-strivo-secondary">
                {match.matchScore}% match
              </p>
            </div>
          </div>

          <p className="rounded-lg bg-strivo-muted p-3 text-sm text-strivo-secondary">
            {match.reasonText}
          </p>

          <div className="grid gap-3 text-sm">
            {match.college && (
              <div className="flex justify-between">
                <span className="text-strivo-secondary">College</span>
                <span className="font-medium">{match.college}</span>
              </div>
            )}
            {match.stream && (
              <div className="flex justify-between">
                <span className="text-strivo-secondary">Stream</span>
                <span className="font-medium">{match.stream}</span>
              </div>
            )}
            {match.goal && (
              <div className="flex justify-between">
                <span className="text-strivo-secondary">Goal</span>
                <span className="font-medium">{formatStudyGoal(match.goal)}</span>
              </div>
            )}
            {match.studyTimes.length > 0 && (
              <div className="flex justify-between">
                <span className="text-strivo-secondary">Study times</span>
                <span className="font-medium text-right">
                  {formatStudyTimes(match.studyTimes)}
                </span>
              </div>
            )}
            {match.partnerType && (
              <div className="flex justify-between">
                <span className="text-strivo-secondary">Partner type</span>
                <span className="font-medium">
                  {formatPartnerType(match.partnerType)}
                </span>
              </div>
            )}
          </div>

          {match.subjects.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-strivo-secondary">Subjects</p>
              <div className="flex flex-wrap gap-1.5">
                {match.subjects.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {match.bio && (
            <div className="space-y-1">
              <p className="text-sm text-strivo-secondary">Bio</p>
              <p className="text-sm">{match.bio}</p>
            </div>
          )}

          {match.isMentor && match.achievementBadge && (
            <Badge variant="teal">{match.achievementBadge}</Badge>
          )}

          <div className="flex gap-2 pt-2">
            {match.isMentor ? (
              <Button
                className="flex-1"
                onClick={requestMentorSession}
                disabled={requestingMentor}
              >
                {requestingMentor ? "Sending..." : "Request mentor session"}
              </Button>
            ) : (
              <>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onSkip(match.id);
                onOpenChange(false);
              }}
              disabled={isSent}
            >
              <X className="h-4 w-4" />
              Skip
            </Button>
            <Button
              className="flex-1"
              onClick={() => onConnect(match.id)}
              disabled={isConnecting || isSent}
              variant={isSent ? "secondary" : "default"}
            >
              {isSent ? "Sent" : "Connect"}
            </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
