import { z } from "zod";

export const RoleEnum = z.enum(["user", "admin"]);

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
  role: RoleEnum.optional().default("user"),
  isActive: z.boolean().optional().default(true),
  interests: z.array(z.string().trim()).optional().default([]),
});

export const updateUserSchema = createUserSchema.partial();

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const userValidation = {
  createUserSchema,
  updateUserSchema,
  loginSchema,
  changePasswordSchema,
};

