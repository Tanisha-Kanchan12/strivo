import { z } from "zod";

export const profileUpdateSchema = z.object({
  bio: z.string().max(500, "Bio is too long").optional().or(z.literal("")),
  city: z.string().max(80, "City is too long").optional().or(z.literal("")),
  college: z.string().max(120, "College name is too long").optional().or(z.literal("")),
  stream: z.string().max(120, "Stream is too long").optional().or(z.literal("")),
  profilePicUrl: z.string().url().optional().or(z.literal("")),
  subjects: z
    .array(z.string().min(1).max(60))
    .max(10, "Maximum 10 subjects allowed")
    .optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
