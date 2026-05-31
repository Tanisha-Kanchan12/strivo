import { z } from "zod";

export const liveNowTopicSchema = z.enum([
  "PM_CASE",
  "CONSULTING",
  "MOCK_INTERVIEW",
  "GD_PRACTICE",
  "HACKATHON",
]);

export const startLiveNowSchema = z.object({
  topic: liveNowTopicSchema,
});

export const liveNowConnectSchema = z.object({
  targetUserId: z.string().min(1),
});
