import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import { PostServices } from "./post.services";
import { createPostSchema } from "./post.validation";

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

// Fetch All Posts (Visible to everyone, paginated)
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

export const postController = {
  createPost,
  fetchPosts,
  fetchUserPosts,
  getSinglePost,
};

