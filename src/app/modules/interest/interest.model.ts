import mongoose, { Schema } from "mongoose";
import { IInterest } from "./interest.interface";

const interestSchema: Schema<IInterest> = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["published", "draft"],
      default: "published",
    },
    color: {
      type: String,
      default: "bg-indigo-600",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

interestSchema.index({ title: 1 }, { unique: true });
interestSchema.index({ status: 1 });
interestSchema.index({ createdAt: -1 });

export const InterestModel = mongoose.model<IInterest>(
  "Interest",
  interestSchema
);

