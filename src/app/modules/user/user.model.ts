import mongoose, { Schema } from "mongoose";
import { IUser } from "./user.interface";

const userSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    interests: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// ✅ Required Indexes (defined via schema.index for visibility & efficiency)
// 1. Unique index on email for login & duplicate check (GET/POST by email)
userSchema.index({ email: 1 }, { unique: true });

// 2. Index on createdAt for paginated Admin list users operation
userSchema.index({ createdAt: -1 });

// 3. Multikey index on interests for Scenario 1: Group by Interests aggregation
userSchema.index({ interests: 1 });

export const UserModel = mongoose.model<IUser>("User", userSchema);

