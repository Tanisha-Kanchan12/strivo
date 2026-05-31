import { z } from "zod";

export const hackathonRoleSchema = z.enum([
  "DEVELOPER",
  "DESIGNER",
  "PM",
  "OTHER",
]);

export const createHackathonPostSchema = z.object({
  hackathonName: z.string().min(2).max(120),
  rolesNeeded: z.array(hackathonRoleSchema).min(1),
  cityPreference: z.string().max(80).optional().nullable(),
  deadline: z.string().min(1),
});
