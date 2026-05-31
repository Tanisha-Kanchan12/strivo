import { z } from "zod";

export const availabilityStatusSchema = z.object({
  status: z.enum(["AVAILABLE", "STUDYING_ALONE", "NOT_AVAILABLE", "AVAILABLE_AT"]),
  availableAt: z.string().datetime().optional().nullable(),
});
