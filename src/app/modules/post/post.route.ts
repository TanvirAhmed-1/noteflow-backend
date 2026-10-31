import { Router } from "express";
import { postController } from "./post.controller";
import { auth } from "../../middlewares/auth.middleware";

const route = Router();

// Admin unified table endpoint (Public/Community & Private/Personal posts & notes)
route.get(
  "/posts/admin-table",
  auth("admin"),
  postController.fetchAdminUnifiedPostsTable
);

// Publicly visible posts
route.get("/posts", postController.fetchPosts);
route.get("/posts/user/:userId", postController.fetchUserPosts);
route.get("/users/:userId/posts", postController.fetchUserPosts);
route.get("/posts/:postId", postController.getSinglePost);

// Authenticated users can create, update, and delete posts
route.post("/posts", auth("user", "admin"), postController.createPost);
route.put("/posts/:postId", auth("user", "admin"), postController.updatePost);
route.delete("/posts/:postId", auth("user", "admin"), postController.deletePost);

export const postRoute = route;
