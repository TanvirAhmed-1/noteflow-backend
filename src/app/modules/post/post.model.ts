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
    interest: {
      type: String,
      trim: true,
      default: "General",
    },
    type: {
      type: String,
      enum: ["personal", "community"],
      default: "community",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// 1. Compound index on { userId: 1, createdAt: -1 }
postSchema.index({ userId: 1, createdAt: -1 });

// 2. Compound index on { interest: 1, createdAt: -1 } for interest-based filtering
postSchema.index({ interest: 1, createdAt: -1 });

// 3. Index on { createdAt: -1 } for paginated list of all posts
postSchema.index({ createdAt: -1 });

export const PostModel = mongoose.model<IPost>("Post", postSchema);
