import mongoose from "mongoose";
import { PostModel } from "./post.model";
import { UserModel } from "../user/user.model";
import { IPost } from "./post.interface";

// Create a post
const createPostDB = async (payload: IPost) => {
  const result = await PostModel.create(payload);
  return result;
};

// Fetch all posts (Visible to everyone, paginated, uses { createdAt: -1 } index)
const fetchPostsDB = async (query: Record<string, any> = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    PostModel.find({})
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    PostModel.countDocuments({}),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data,
  };
};

// ✅ Scenario 2: User Posts ($lookup)
// Task: Retrieve all posts belonging to a particular user.
// Constraint: Use a single aggregation pipeline with a $lookup stage.
// Index usage:
// - $match on User._id uses built-in { _id: 1 } index on Users
// - $lookup on posts.userId + $sort on createdAt uses { userId: 1, createdAt: -1 } index on Posts
const fetchUserPostsByLookupDB = async (
  userId: string,
  query: Record<string, any> = {}
) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid userId");
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const result = await UserModel.aggregate([
    // Stage 1: Match the target user by _id (uses { _id: 1 } index)
    {
      $match: {
        _id: userObjectId,
      },
    },
    // Stage 2: Lookup all posts belonging to this user (uses { userId: 1, createdAt: -1 } index on posts)
    {
      $lookup: {
        from: "posts",
        localField: "_id",
        foreignField: "userId",
        pipeline: [
          { $sort: { createdAt: -1 } },
          {
            $facet: {
              meta: [{ $count: "total" }],
              data: [{ $skip: skip }, { $limit: limit }],
            },
          },
        ],
        as: "postsResult",
      },
    },
    // Stage 3: Shape the output cleanly without password
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        role: 1,
        interests: 1,
        postsData: { $arrayElemAt: ["$postsResult", 0] },
      },
    },
  ]);

  if (!result.length) {
    throw new Error("User not found");
  }

  const userWithPosts = result[0];
  const total = userWithPosts.postsData?.meta?.[0]?.total || 0;
  const posts = userWithPosts.postsData?.data || [];

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    user: {
      _id: userWithPosts._id,
      name: userWithPosts.name,
      email: userWithPosts.email,
      role: userWithPosts.role,
      interests: userWithPosts.interests,
    },
    posts,
  };
};

// Fetch single post by ID (Uses built-in { _id: 1 } index)
const fetchSinglePostDB = async (postId: string) => {
  const post = await PostModel.findById(postId).populate(
    "userId",
    "name email role"
  );
  if (!post) {
    throw new Error("Post not found");
  }
  return post;
};

export const PostServices = {
  createPostDB,
  fetchPostsDB,
  fetchUserPostsByLookupDB,
  fetchSinglePostDB,
};

