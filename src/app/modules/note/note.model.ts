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
    type: {
      type: String,
      enum: ["personal", "community"],
      default: "personal",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// 1. Compound index (ESR rule: Equality on userId, Sort on createdAt)
noteSchema.index({ userId: 1, createdAt: -1 });

// 2. Compound index on type + createdAt for filtering personal vs community notes
noteSchema.index({ type: 1, createdAt: -1 });

// 3. Index on createdAt for Admin viewing everyone's notes with pagination
noteSchema.index({ createdAt: -1 });

export const NoteModel = mongoose.model<INote>("Note", noteSchema);
