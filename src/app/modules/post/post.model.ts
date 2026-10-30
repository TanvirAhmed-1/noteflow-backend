import mongoose, { Schema } from "mongoose";
import { IPost } from "./post.interface";

const postSchema: Schema<IPost> = new Schema(
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
// 1. Compound index on { userId: 1, createdAt: -1 }
//    Supports Scenario 2 ($lookup stage on foreignField: "userId" sorted by createdAt: -1)
postSchema.index({ userId: 1, createdAt: -1 });

// 2. Index on { createdAt: -1 } for public paginated list of all posts
postSchema.index({ createdAt: -1 });

export const PostModel = mongoose.model<IPost>("Post", postSchema);

