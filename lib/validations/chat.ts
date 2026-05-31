import { z } from "zod";

export const sendMessageSchema = z.object({
  pairId: z.string().min(1),
  content: z.string().min(1, "Message cannot be empty").max(2000),
});

export const markReadSchema = z.object({
  pairId: z.string().min(1),
});

export const typingSchema = z.object({
  pairId: z.string().min(1),
  isTyping: z.boolean(),
});
