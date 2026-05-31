import { z } from "zod";

export const createGoalSchema = z.object({
  title: z.string().min(2).max(200),
  targetNumber: z.number().int().min(1).max(100000),
  deadline: z.string().datetime().optional().nullable(),
});

export const updateGoalSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  targetNumber: z.number().int().min(1).max(100000).optional(),
  currentProgress: z.number().int().min(0).optional(),
  deadline: z.string().datetime().optional().nullable(),
});
