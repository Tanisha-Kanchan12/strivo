"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { PartnerType, StudyGoal, StudyTime, UserStatus } from "@prisma/client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  SelectableChip,
  SelectableChipGrid,
} from "@/components/ui/selectable-chip";
import {
  PARTNER_TYPE_OPTIONS,
  STUDY_GOAL_OPTIONS,
  STUDY_TIME_OPTIONS,
  USER_STATUS_OPTIONS,
} from "@/lib/constants/onboarding";
import {
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  type OnboardingStep1Input,
  type OnboardingStep2Input,
  type OnboardingStep3Input,
} from "@/lib/validations/onboarding";

interface OnboardingWizardProps {
  initialStep: 1 | 2 | 3;
  initialData: {
    name: string;
    status: UserStatus | null;
    goal: StudyGoal | null;
    field: string;
    studyTimes: StudyTime[];
    partnerType: PartnerType | null;
  };
}

export function OnboardingWizard({
  initialStep,
  initialData,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 3 uses local state to avoid react-hook-form setValue + zodResolver crashes
  const [studyTimes, setStudyTimes] = useState<StudyTime[]>([]);
  const [partnerType, setPartnerType] = useState<PartnerType>("EITHER");
  const [isMentor, setIsMentor] = useState(false);
  const [achievementBadge, setAchievementBadge] = useState("");
  const [step3Errors, setStep3Errors] = useState<{
    studyTimes?: string;
    partnerType?: string;
  }>({});

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  const step1Form = useForm<OnboardingStep1Input>({
    resolver: zodResolver(onboardingStep1Schema),
    defaultValues: {
      name: initialData.name ?? "",
      status: initialData.status ?? undefined,
    },
  });

  const step2Form = useForm<OnboardingStep2Input>({
    resolver: zodResolver(onboardingStep2Schema),
    defaultValues: {
      goal: initialData.goal ?? undefined,
      field: initialData.field ?? "",
    },
  });

  async function submitStep<T>(stepNum: 1 | 2 | 3, data: T) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: stepNum, data }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error ?? "Something went wrong");
      }

      if (result.complete) {
        toast.success("You're all set! Welcome to Strivo.");
        router.push("/home");
        router.refresh();
        return;
      }

      if (result.nextStep) {
        setStep(result.nextStep);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save progress"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedStatus = step1Form.watch("status") ?? undefined;
  const selectedGoal = step2Form.watch("goal") ?? undefined;

  function toggleStudyTime(value: StudyTime) {
    setStudyTimes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
    setStep3Errors((e) => ({ ...e, studyTimes: undefined }));
  }

  function selectPartnerType(value: PartnerType) {
    setPartnerType(value);
    setStep3Errors((e) => ({ ...e, partnerType: undefined }));
  }

  async function handleStep3Submit(e: React.FormEvent) {
    e.preventDefault();
    const payload: OnboardingStep3Input = {
      studyTimes,
      partnerType,
      isMentor: isMentor || undefined,
      achievementBadge: isMentor ? achievementBadge : "",
    };
    const parsed = onboardingStep3Schema.safeParse(payload);

    if (!parsed.success) {
      const nextErrors: typeof step3Errors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "studyTimes") nextErrors.studyTimes = issue.message;
        if (field === "partnerType") nextErrors.partnerType = issue.message;
      }
      setStep3Errors(nextErrors);
      return;
    }

    await submitStep(3, parsed.data);
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-strivo-text">
          Let&apos;s set you up
        </h1>
        <p className="mt-2 text-strivo-secondary">
          3 quick steps to find your perfect study partner
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-strivo-secondary">
          <span>Step {step} of 3</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <form
              onSubmit={step1Form.handleSubmit((data) => submitStep(1, data))}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  placeholder="What should we call you?"
                  {...step1Form.register("name")}
                />
                {step1Form.formState.errors.name?.message && (
                  <p className="text-sm text-destructive">
                    {step1Form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label>Current status</Label>
                <SelectableChipGrid columns={1}>
                  {USER_STATUS_OPTIONS.map((option) => (
                    <SelectableChip
                      key={option.value}
                      label={option.label}
                      description={option.description}
                      selected={selectedStatus === option.value}
                      onClick={() =>
                        step1Form.setValue("status", option.value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    />
                  ))}
                </SelectableChipGrid>
                {step1Form.formState.errors.status?.message && (
                  <p className="text-sm text-destructive">
                    {step1Form.formState.errors.status.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <form
              onSubmit={step2Form.handleSubmit((data) => submitStep(2, data))}
              className="space-y-6"
            >
              <div className="space-y-3">
                <Label>Primary goal</Label>
                <SelectableChipGrid columns={2}>
                  {STUDY_GOAL_OPTIONS.map((option) => (
                    <SelectableChip
                      key={option.value}
                      label={option.label}
                      selected={selectedGoal === option.value}
                      onClick={() =>
                        step2Form.setValue("goal", option.value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    />
                  ))}
                </SelectableChipGrid>
                {step2Form.formState.errors.goal?.message && (
                  <p className="text-sm text-destructive">
                    {step2Form.formState.errors.goal.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="field">
                  Field / stream{" "}
                  <span className="font-normal text-strivo-secondary">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="field"
                  placeholder="e.g. Computer Science, PCB, Commerce"
                  {...step2Form.register("field")}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" className="flex-1" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <form onSubmit={handleStep3Submit} className="space-y-6">
              <div className="space-y-3">
                <Label>When do you usually study?</Label>
                <p className="text-xs text-strivo-secondary">
                  Select all that apply. At least one required.
                </p>
                <SelectableChipGrid columns={2}>
                  {STUDY_TIME_OPTIONS.map((option) => (
                    <SelectableChip
                      key={option.value}
                      label={option.label}
                      description={option.hours}
                      selected={studyTimes.includes(option.value)}
                      onClick={() => toggleStudyTime(option.value)}
                    />
                  ))}
                </SelectableChipGrid>
                {step3Errors.studyTimes && (
                  <p className="text-sm text-destructive">{step3Errors.studyTimes}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label>Study partner preference</Label>
                <SelectableChipGrid columns={1}>
                  {PARTNER_TYPE_OPTIONS.map((option) => (
                    <SelectableChip
                      key={option.value}
                      label={option.label}
                      description={option.description}
                      selected={partnerType === option.value}
                      onClick={() => selectPartnerType(option.value)}
                    />
                  ))}
                </SelectableChipGrid>
                {step3Errors.partnerType && (
                  <p className="text-sm text-destructive">{step3Errors.partnerType}</p>
                )}
              </div>

              <div className="space-y-3 rounded-xl border border-strivo-border p-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mentor-mode">I want to be a Mentor</Label>
                  <Switch
                    id="mentor-mode"
                    checked={isMentor}
                    onCheckedChange={setIsMentor}
                  />
                </div>
                {isMentor && (
                  <div className="space-y-2">
                    <Label htmlFor="achievement-badge">Achievement badge</Label>
                    <Input
                      id="achievement-badge"
                      placeholder='e.g. "Cleared CAT 99 percentile", "IIT Delhi CSE"'
                      value={achievementBadge}
                      onChange={(e) => setAchievementBadge(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" className="flex-1" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Finishing...
                    </>
                  ) : (
                    "Start matching"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
