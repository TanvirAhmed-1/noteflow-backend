import httpStatus from "http-status";
import mongoose from "mongoose";
import AppError from "../../errors/AppError";
import { PostModel } from "./post.model";
import { UserModel } from "../user/user.model";
import { IPost } from "./post.interface";

// Create a post
const createPostDB = async (payload: IPost) => {
  const result = await PostModel.create(payload);

  // Automatically sync user's active interests when publishing a community post
  if (payload.interest && payload.userId) {
    const interestItems = (
      Array.isArray(payload.interest) ? payload.interest : [payload.interest]
    ).filter(Boolean);

    if (interestItems.length > 0) {
      await UserModel.findByIdAndUpdate(payload.userId, {
        $addToSet: { interests: { $each: interestItems } },
      });
    }
  }

  return result.populate("userId", "name email role interests");
};

// Fetch all posts with rich filtering (interest, userName, type, date, searchTerm) & pagination
const fetchPostsDB = async (query: Record<string, any> = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};

  // 1. Filter by User Name / Email
  if (query.userName && String(query.userName).trim() !== "") {
    const userRegex = new RegExp(String(query.userName).trim(), "i");
    const matchedUsers = await UserModel.find({
      $or: [{ name: userRegex }, { email: userRegex }],
    }).select("_id");
    filter.userId = { $in: matchedUsers.map((u) => u._id) };
  }

  // 2. Filter by Type (personal/private vs community/public)
  if (
    query.type &&
    String(query.type).trim() !== "" &&
    String(query.type).toLowerCase() !== "all"
  ) {
    const normalizedType = String(query.type).toLowerCase();
    if (normalizedType === "personal" || normalizedType === "private") {
      filter.type = "personal";
    } else if (normalizedType === "community" || normalizedType === "public") {
      filter.$and = [
        ...(filter.$and || []),
        { $or: [{ type: "community" }, { type: { $exists: false } }] },
      ];
    }
  }

  // 3. Filter by Interest (matches post.interest OR author's user.interests)
  if (
    query.interest &&
    String(query.interest).trim() !== "" &&
    String(query.interest).toLowerCase() !== "all"
  ) {
    const interestTerm = String(query.interest).trim();
    const interestRegex = new RegExp(
      `(^|,\\s*)${interestTerm}(,|$)|^${interestTerm}$`,
      "i"
    );
    const usersWithInterest = await UserModel.find({
      interests: interestRegex,
    }).select("_id");

    filter.$and = [
      ...(filter.$and || []),
      {
        $or: [
          { interest: interestRegex },
          { userId: { $in: usersWithInterest.map((u) => u._id) } },
        ],
      },
    ];
  }

  // 4. Filter by Date (YYYY-MM-DD)
  if (query.date && String(query.date).trim() !== "") {
    const dateStr = String(query.date).trim();
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
    if (!isNaN(startOfDay.getTime()) && !isNaN(endOfDay.getTime())) {
      filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }
  }

  // 5. Filter by general searchTerm (title, content, or interest)
  if (query.searchTerm && String(query.searchTerm).trim() !== "") {
    const searchRegex = new RegExp(String(query.searchTerm).trim(), "i");
    filter.$and = [
      ...(filter.$and || []),
      {
        $or: [
          { title: searchRegex },
          { content: searchRegex },
          { interest: searchRegex },
        ],
      },
    ];
  }

  const [data, total] = await Promise.all([
    PostModel.find(filter)
      .populate("userId", "name email role interests")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    PostModel.countDocuments(filter),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.max(1, Math.ceil(total / limit)),
    },
    data,
  };
};

// ✅ Admin Unified Table Feed (Combines User Public/Community & Private/Personal Posts + Notes)
// Supports pagination & filtering by interest, userName (name), type (personal/private vs community/public), and date
const fetchAdminUnifiedPostsTableDB = async (query: Record<string, any> = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;

  const matchConditions: Record<string, any>[] = [];

  // 1. Filter by Type: personal (private) vs community (public)
  if (
    query.type &&
    String(query.type).trim() !== "" &&
    String(query.type).toLowerCase() !== "all"
  ) {
    const t = String(query.type).toLowerCase();
    if (t === "personal" || t === "private") {
      matchConditions.push({ type: "personal" });
    } else if (t === "community" || t === "public") {
      matchConditions.push({ type: "community" });
    }
  }

  // 2. Filter by User Name / Email
  if (query.userName && String(query.userName).trim() !== "") {
    const nameRegex = new RegExp(String(query.userName).trim(), "i");
    matchConditions.push({
      $or: [
        { "author.name": nameRegex },
        { "author.email": nameRegex },
      ],
    });
  }

  // 3. Filter by Interest (matches item's interest OR author's interests array)
  if (
    query.interest &&
    String(query.interest).trim() !== "" &&
    String(query.interest).toLowerCase() !== "all"
  ) {
    const interestRegex = new RegExp(String(query.interest).trim(), "i");
    matchConditions.push({
      $or: [
        { interest: interestRegex },
        { "author.interests": interestRegex },
      ],
    });
  }

  // 4. Filter by Date (YYYY-MM-DD)
  if (query.date && String(query.date).trim() !== "") {
    const dateStr = String(query.date).trim();
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
    if (!isNaN(startOfDay.getTime()) && !isNaN(endOfDay.getTime())) {
      matchConditions.push({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });
    }
  }

  // 5. Filter by searchTerm
  if (query.searchTerm && String(query.searchTerm).trim() !== "") {
    const searchRegex = new RegExp(String(query.searchTerm).trim(), "i");
    matchConditions.push({
      $or: [
        { title: searchRegex },
        { content: searchRegex },
        { interest: searchRegex },
        { "author.name": searchRegex },
        { "author.email": searchRegex },
      ],
    });
  }

  const pipeline: any[] = [
    // Normalize fields from posts collection
    {
      $project: {
        _id: 1,
        title: 1,
        content: 1,
        interest: { $ifNull: ["$interest", "General"] },
        type: { $ifNull: ["$type", "community"] },
        userId: 1,
        createdAt: 1,
        source: { $literal: "post" },
      },
    },
    // Union with notes collection (which has personal & community notes)
    {
      $unionWith: {
        coll: "notes",
        pipeline: [
          {
            $project: {
              _id: 1,
              title: 1,
              content: 1,
              interest: { $literal: "" },
              type: { $ifNull: ["$type", "personal"] },
              userId: 1,
              createdAt: 1,
              source: { $literal: "note" },
            },
          },
        ],
      },
    },
    // Lookup author details from users collection (uses { _id: 1 } index on users)
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "authorArr",
      },
    },
    {
      $addFields: {
        author: { $arrayElemAt: ["$authorArr", 0] },
      },
    },
  ];

  if (matchConditions.length > 0) {
    pipeline.push({
      $match: {
        $and: matchConditions,
      },
    });
  }

  pipeline.push(
    { $sort: { createdAt: -1 } },
    {
      $project: {
        _id: 1,
        title: 1,
        content: 1,
        type: 1,
        source: 1,
        createdAt: 1,
        interest: {
          $cond: [
            {
              $and: [
                { $ne: ["$interest", ""] },
                { $ne: ["$interest", null] },
              ],
            },
            "$interest",
            {
              $ifNull: [
                { $arrayElemAt: ["$author.interests", 0] },
                "General",
              ],
            },
          ],
        },
        userId: {
          _id: "$author._id",
          name: { $ifNull: ["$author.name", "Unknown User"] },
          email: { $ifNull: ["$author.email", ""] },
          role: { $ifNull: ["$author.role", "user"] },
          interests: { $ifNull: ["$author.interests", []] },
        },
      },
    },
    {
      $facet: {
        meta: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    }
  );

  const aggResult = await PostModel.aggregate(pipeline);
  const facet = aggResult[0] || { meta: [], data: [] };
  const total = facet.meta[0]?.total || 0;

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.max(1, Math.ceil(total / limit)),
    },
    data: facet.data,
  };
};

// Scenario 2: User Posts ($lookup)
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
    {
      $match: {
        _id: userObjectId,
      },
    },
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
      totalPage: Math.max(1, Math.ceil(total / limit)),
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

// Fetch single post by ID
const fetchSinglePostDB = async (postId: string) => {
  const post = await PostModel.findById(postId).populate(
    "userId",
    "name email role interests"
  );
  if (!post) {
    throw new AppError(httpStatus.NOT_FOUND, "Post not found");
  }
  return post;
};

// Update post by ID
const updatePostDB = async (payload: Partial<IPost>, postId: string) => {
  const isExists = await PostModel.findById(postId);
  if (!isExists) {
    throw new AppError(httpStatus.NOT_FOUND, "Post not found");
  }

  const result = await PostModel.findByIdAndUpdate(postId, payload, {
    new: true,
    runValidators: true,
  }).populate("userId", "name email role interests");
  return result;
};

// Delete post by ID
const deletePostDB = async (postId: string) => {
  const isExists = await PostModel.findById(postId);
  if (!isExists) {
    throw new AppError(httpStatus.NOT_FOUND, "Post not found");
  }

  const result = await PostModel.findByIdAndDelete(postId);
  return result;
};

export const PostServices = {
  createPostDB,
  fetchPostsDB,
  fetchAdminUnifiedPostsTableDB,
  fetchUserPostsByLookupDB,
  fetchSinglePostDB,
  updatePostDB,
  deletePostDB,
};
