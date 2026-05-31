"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ProfileCompletionBannerProps {
  completion: number;
}

function getDismissKey(): string {
  const today = new Date().toISOString().split("T")[0];
  return `strivo-profile-banner-dismissed-${today}`;
}

export function ProfileCompletionBanner({
  completion,
}: ProfileCompletionBannerProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const key = getDismissKey();
    setDismissed(localStorage.getItem(key) === "true");
  }, []);

  if (completion >= 100 || dismissed) return null;

  function handleDismiss() {
    localStorage.setItem(getDismissKey(), "true");
    setDismissed(true);
  }

  return (
    <div className="relative surface-card p-6">
      <button
        onClick={handleDismiss}
        className="absolute right-4 top-4 rounded-full p-1.5 text-strivo-secondary hover:bg-strivo-muted"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="space-y-4 pr-8">
        <p className="text-sm font-semibold text-strivo-text">
          Complete your profile
        </p>
        <Progress value={completion} />
        <Button size="sm" asChild>
          <Link href="/profile/edit">Complete profile</Link>
        </Button>
      </div>
    </div>
  );
}
