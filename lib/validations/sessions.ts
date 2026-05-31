import { SessionPlatform } from "@prisma/client";
import { z } from "zod";

export const createTargetSchema = z.object({
  pairId: z.string().min(1),
  task: z.string().min(1, "Task is required").max(200),
});

export const checkinSchema = z.object({
  pairId: z.string().min(1),
  completed: z.boolean(),
});

export const scheduleSessionSchema = z.object({
  pairId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(5).max(480),
  platform: z.nativeEnum(SessionPlatform),
  location: z.string().max(200).optional(),
});

export const focusStartSchema = z.object({
  pairId: z.string().min(1),
  durationMinutes: z.enum(["25", "45", "60"]).transform(Number),
});

export const focusControlSchema = z.object({
  action: z.enum(["start", "pause", "resume"]),
  remainingSeconds: z.number().int().min(0),
});

export const focusEndSchema = z.object({
  remainingSeconds: z.number().int().min(0).optional(),
});

export const sessionRatingSchema = z.object({
  stars: z.number().int().min(1).max(5),
});
