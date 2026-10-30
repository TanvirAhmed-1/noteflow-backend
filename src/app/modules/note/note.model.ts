import mongoose, { Schema } from "mongoose";
import { INote } from "./note.interface";

const noteSchema: Schema<INote> = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// ✅ Required Indexes (defined via schema.index for visibility & efficiency)
// 1. Compound index (ESR rule: Equality on userId, Sort on createdAt)
//    Supports User listing their own notes with pagination AND prefix { userId: 1 } for countDocuments({ userId })
noteSchema.index({ userId: 1, createdAt: -1 });

// 2. Index on createdAt for Admin viewing everyone's notes with pagination
noteSchema.index({ createdAt: -1 });

export const NoteModel = mongoose.model<INote>("Note", noteSchema);

