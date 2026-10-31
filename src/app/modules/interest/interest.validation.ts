import { z } from "zod";

export const InterestStatusEnum = z.enum(["published", "draft"]);

export const createInterestSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  description: z.string().optional().default(""),
  status: InterestStatusEnum.optional().default("published"),
  color: z.string().optional().default("bg-indigo-600"),
});

export const updateInterestSchema = createInterestSchema.partial();

export const interestValidation = {
  createInterestSchema,
  updateInterestSchema,
};

