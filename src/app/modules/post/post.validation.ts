import { z } from "zod";

export const PostTypeEnum = z.enum(["personal", "community"]);

export const createPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  interest: z.string().trim().optional().default("General"),
  type: PostTypeEnum.optional().default("community"),
});

export const updatePostSchema = createPostSchema.partial();

export const postValidation = {
  createPostSchema,
  updatePostSchema,
};
