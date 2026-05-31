import { ProfileVisibility, StudyGoal } from "@prisma/client";
import { z } from "zod";

export const settingsUpdateSchema = z.object({
  cityMode: z.boolean().optional(),
  locationAccess: z.boolean().optional(),
  girlsOnlyMode: z.boolean().optional(),
  language: z.string().optional(),
  visibility: z.nativeEnum(ProfileVisibility).optional(),
  goal: z.nativeEnum(StudyGoal).optional(),
  notifyStreakUpdates: z.boolean().optional(),
  notifySessionReminders: z.boolean().optional(),
  notifyNewMatches: z.boolean().optional(),
  notifyConnectAccepted: z.boolean().optional(),
  notifyConnectExpired: z.boolean().optional(),
  notifyShieldUsed: z.boolean().optional(),
  notifyNewMessages: z.boolean().optional(),
  notifyStudyingNow: z.boolean().optional(),
  notifyStreakMilestones: z.boolean().optional(),
  notifyAiNudge: z.boolean().optional(),
});

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;

export const verifyStudentSchema = z.object({
  documentUrl: z.string().url("Invalid document URL"),
});
