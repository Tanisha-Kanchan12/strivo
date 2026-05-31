import { z } from "zod";

export const feedbackSchema = z.object({
  type: z.enum(["BUG", "FEATURE_REQUEST", "GENERAL", "PROBLEM", "SUPPORT"]),
  message: z.string().min(5).max(5000),
  screenshotUrl: z.string().url().optional().nullable(),
});
