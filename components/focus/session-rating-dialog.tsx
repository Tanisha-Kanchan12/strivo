"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SessionRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (stars: number) => Promise<void>;
  partnerName: string;
}

export function SessionRatingDialog({
  open,
  onOpenChange,
  onSubmit,
  partnerName,
}: SessionRatingDialogProps) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (stars === 0) return;
    setIsSubmitting(true);
    try {
      await onSubmit(stars);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-strivo-ink border-white/10 text-white sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Rate your session</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-white/60">
          How was studying with {partnerName}?
        </p>
        <div className="flex justify-center gap-2 py-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setStars(s)}
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  (hover || stars) >= s
                    ? "fill-strivo-coral text-strivo-coral"
                    : "text-white/20"
                )}
              />
            </button>
          ))}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={stars === 0 || isSubmitting}
          className="w-full"
        >
          Submit rating
        </Button>
      </DialogContent>
    </Dialog>
  );
}
