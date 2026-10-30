import { Router } from "express";
import { postController } from "./post.controller";
import { auth } from "../../middlewares/auth.middleware";

const route = Router();

// Publicly visible posts
route.get("/posts", postController.fetchPosts);
route.get("/posts/user/:userId", postController.fetchUserPosts);
route.get("/users/:userId/posts", postController.fetchUserPosts);
route.get("/posts/:postId", postController.getSinglePost);

// Authenticated users can create posts
route.post("/posts", auth("user", "admin"), postController.createPost);

export const postRoute = route;

