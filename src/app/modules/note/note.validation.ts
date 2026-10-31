import { z } from "zod";

export const NoteTypeEnum = z.enum(["personal", "community"]);

export const createNoteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  type: NoteTypeEnum.optional().default("personal"),
});

export const updateNoteSchema = createNoteSchema.partial();

export const noteValidation = {
  createNoteSchema,
  updateNoteSchema,
};
