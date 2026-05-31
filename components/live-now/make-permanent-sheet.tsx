"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MakePermanentSheetProps {
  pairId: string;
  partnerName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismissed?: () => void;
}

export function MakePermanentSheet({
  pairId,
  partnerName,
  open,
  onOpenChange,
  onDismissed,
}: MakePermanentSheetProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handlePermanent() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/live-now/pairs/${pairId}/permanent`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("You're now study partners!");
      onOpenChange(false);
      router.push(`/pairs/${pairId}`);
    } catch {
      toast.error("Could not save pair");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDismiss() {
    setIsLoading(true);
    try {
      await fetch(`/api/live-now/pairs/${pairId}/dismiss`, { method: "POST" });
      onOpenChange(false);
      onDismissed?.();
      router.push("/home");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make this a study pair?</DialogTitle>
          <DialogDescription>
            Keep {partnerName ?? "this student"} as a permanent partner on Strivo,
            or leave without saving.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={handlePermanent} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, add to My Pairs"}
          </Button>
          <Button variant="outline" onClick={handleDismiss} disabled={isLoading}>
            No thanks
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
