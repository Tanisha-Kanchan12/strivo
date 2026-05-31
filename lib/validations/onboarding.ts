import { z } from "zod";

const userStatusValues = ["SCHOOL", "COLLEGE", "ASPIRANT"] as const;
const studyGoalValues = [
  "JEE",
  "NEET",
  "SSC_CGL",
  "SSC_CHSL",
  "UPSC",
  "CAT",
  "CUET",
  "GATE",
  "BANK_PO_CLERK",
  "RRB_NTPC",
  "BOARD_EXAMS",
  "COLLEGE_EXAMS",
  "MBA_ENTRANCE",
  "PLACEMENT_PREP",
  "PRODUCT_MANAGEMENT",
  "DATA_SCIENCE",
  "CONSULTING",
  "OTHER",
] as const;
const studyTimeValues = ["MORNING", "AFTERNOON", "EVENING", "NIGHT"] as const;
const partnerTypeValues = ["ACCOUNTABILITY", "ACTIVE_BUDDY", "EITHER"] as const;

export const onboardingStep1Schema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name is too long"),
  status: z.enum(userStatusValues, {
    required_error: "Please select your current status",
    invalid_type_error: "Please select your current status",
  }),
});

export const onboardingStep2Schema = z.object({
  goal: z.enum(studyGoalValues, {
    required_error: "Please select your primary goal",
    invalid_type_error: "Please select your primary goal",
  }),
  field: z.string().max(100, "Field is too long").optional().or(z.literal("")),
});

export const onboardingStep3Schema = z.object({
  studyTimes: z
    .array(z.enum(studyTimeValues))
    .min(1, "Select at least one study time"),
  partnerType: z.enum(partnerTypeValues, {
    required_error: "Please select a partner type preference",
    invalid_type_error: "Please select a partner type preference",
  }),
  isMentor: z.boolean().optional(),
  achievementBadge: z.string().max(120).optional().or(z.literal("")),
});

export type OnboardingStep1Input = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2Input = z.infer<typeof onboardingStep2Schema>;
export type OnboardingStep3Input = z.infer<typeof onboardingStep3Schema>;

export const onboardingPatchSchema = z.discriminatedUnion("step", [
  z.object({ step: z.literal(1), data: onboardingStep1Schema }),
  z.object({ step: z.literal(2), data: onboardingStep2Schema }),
  z.object({ step: z.literal(3), data: onboardingStep3Schema }),
]);
