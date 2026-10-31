import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import { PostServices } from "./post.services";
import { createPostSchema, updatePostSchema } from "./post.validation";

// Create Post (Authenticated User/Admin)
const createPost = catchAsync(async (req, res) => {
  const validatedData = createPostSchema.parse(req.body);
  const result = await PostServices.createPostDB({
    ...validatedData,
    userId: req.user!.id,
  });

  res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: 201,
    message: "Post created successfully",
    result,
  });
});

// Fetch All Posts (Filtered by interest, userName, type, date, searchTerm & Paginated)
const fetchPosts = catchAsync(async (req, res) => {
  const result = await PostServices.fetchPostsDB(req.query);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: 200,
    message: "Posts fetched successfully",
    meta: result.meta,
    result: result.data,
  });
});

// Fetch Admin Unified Table (Public/Community & Private/Personal Posts & Notes)
const fetchAdminUnifiedPostsTable = catchAsync(async (req, res) => {
  const result = await PostServices.fetchAdminUnifiedPostsTableDB(req.query);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: 200,
    message: "Admin interest & posts table fetched successfully",
    meta: result.meta,
    result: result.data,
  });
});

// Scenario 2: Fetch all posts belonging to a particular user via $lookup aggregation
const fetchUserPosts = catchAsync(async (req, res) => {
  const userId = req.params.userId as string;
  const result = await PostServices.fetchUserPostsByLookupDB(userId, req.query);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: 200,
    message: "User posts fetched successfully using $lookup",
    meta: result.meta,
    user: result.user,
    result: result.posts,
  });
});

// Get Single Post by ID
const getSinglePost = catchAsync(async (req, res) => {
  const postId = req.params.postId as string;
  const result = await PostServices.fetchSinglePostDB(postId);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: 200,
    message: "Post fetched successfully",
    result,
  });
});

// Update Post (Author or Admin)
const updatePost = catchAsync(async (req, res) => {
  const postId = req.params.postId as string;
  const existingPost = await PostServices.fetchSinglePostDB(postId);

  const ownerId =
    typeof existingPost.userId === "object" &&
    existingPost.userId !== null &&
    "_id" in existingPost.userId
      ? String((existingPost.userId as any)._id)
      : String(existingPost.userId);

  if (req.user!.role !== "admin" && ownerId !== req.user!.id) {
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      message: "Forbidden: You can only update your own posts",
    });
  }

  const validatedData = updatePostSchema.parse(req.body);
  const result = await PostServices.updatePostDB(validatedData, postId);

  res.status(httpStatus.OK).json({
    success: true,
    message: "Post updated successfully",
    result,
  });
});

// Delete Post (Author or Admin)
const deletePost = catchAsync(async (req, res) => {
  const postId = req.params.postId as string;
  const existingPost = await PostServices.fetchSinglePostDB(postId);

  const ownerId =
    typeof existingPost.userId === "object" &&
    existingPost.userId !== null &&
    "_id" in existingPost.userId
      ? String((existingPost.userId as any)._id)
      : String(existingPost.userId);

  if (req.user!.role !== "admin" && ownerId !== req.user!.id) {
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      message: "Forbidden: You can only delete your own posts",
    });
  }

  const result = await PostServices.deletePostDB(postId);

  res.status(httpStatus.OK).json({
    success: true,
    message: "Post deleted successfully",
    result,
  });
});

export const postController = {
  createPost,
  fetchPosts,
  fetchAdminUnifiedPostsTable,
  fetchUserPosts,
  getSinglePost,
  updatePost,
  deletePost,
};
