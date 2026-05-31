"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAiStore } from "@/store/ai-store";

export function AiBuddySidebarCard() {
  const open = useAiStore((s) => s.open);

  return (
    <div className="surface-card p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-strivo-muted">
          <Sparkles className="h-5 w-5 text-primary-mid" />
        </div>
        <p className="text-sm font-semibold text-strivo-text">AI Study Buddy</p>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-strivo-secondary">
        Ask doubts, case prep, guesstimates, or get a study plan
      </p>
      <Button size="sm" className="mt-4 w-full" onClick={open}>
        <Sparkles className="h-4 w-4" />
        Open Study Buddy
      </Button>
    </div>
  );
}
