"use client";

import { HelpCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { UploadButton } from "@/lib/uploadthing";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<
    "BUG" | "FEATURE_REQUEST" | "GENERAL"
  >("GENERAL");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [problemMessage, setProblemMessage] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [supportMessage, setSupportMessage] = useState("");

  async function submitFeedback(
    type: "BUG" | "FEATURE_REQUEST" | "GENERAL" | "PROBLEM" | "SUPPORT",
    message: string,
    screenshot?: string | null
  ) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message,
          screenshotUrl: screenshot ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      toast.success(data.message ?? "Thanks! We'll get back to you soon.");
      setOpen(false);
      setFeedbackMessage("");
      setProblemMessage("");
      setSupportMessage("");
      setScreenshotUrl(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_4px_20px_rgba(45,74,15,0.35)] transition-transform hover:scale-105"
        aria-label="Help and feedback"
      >
        <HelpCircle className="h-6 w-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Help & Support</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="feedback">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="problem">Problem</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            <TabsContent value="feedback" className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["BUG", "Bug"],
                      ["FEATURE_REQUEST", "Feature Request"],
                      ["GENERAL", "General"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFeedbackCategory(value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        feedbackCategory === value
                          ? "chip-active"
                          : "chip-inactive"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Tell us what you think..."
                  rows={4}
                />
              </div>
              <Button
                className="w-full"
                disabled={isSubmitting || feedbackMessage.length < 5}
                onClick={() =>
                  submitFeedback(feedbackCategory, feedbackMessage)
                }
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Submit"}
              </Button>
            </TabsContent>

            <TabsContent value="problem" className="space-y-4">
              <div className="space-y-2">
                <Label>Describe the problem</Label>
                <Textarea
                  value={problemMessage}
                  onChange={(e) => setProblemMessage(e.target.value)}
                  placeholder="What went wrong?"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Screenshot (optional)</Label>
                {screenshotUrl ? (
                  <p className="text-xs text-primary">Screenshot uploaded</p>
                ) : (
                  <UploadButton
                    endpoint="feedbackScreenshot"
                    onClientUploadComplete={(res) => {
                      setScreenshotUrl(res[0]?.url ?? null);
                      toast.success("Screenshot uploaded");
                    }}
                    onUploadError={() => {
                      toast.error("Upload failed");
                    }}
                  />
                )}
              </div>
              <Button
                className="w-full"
                disabled={isSubmitting || problemMessage.length < 5}
                onClick={() =>
                  submitFeedback("PROBLEM", problemMessage, screenshotUrl)
                }
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Report"}
              </Button>
            </TabsContent>

            <TabsContent value="support" className="space-y-4">
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="How can we help?"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Email (optional)</Label>
                <Input placeholder="you@email.com" disabled className="opacity-60" />
                <p className="text-xs text-strivo-secondary">
                  We use your account email for replies.
                </p>
              </div>
              <Button
                className="w-full"
                disabled={isSubmitting || supportMessage.length < 5}
                onClick={() => submitFeedback("SUPPORT", supportMessage)}
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Contact"}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
