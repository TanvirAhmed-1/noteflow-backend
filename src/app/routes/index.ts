import { Router } from "express";
import { UserRouter } from "../modules/user/user.route";
import { noteRoute } from "../modules/note/note.route";
import { postRoute } from "../modules/post/post.route";
import { interestRoute } from "../modules/interest/interest.route";

const router = Router();

const allRouters = [
  UserRouter,
  noteRoute,
  postRoute,
  interestRoute,
];

allRouters.forEach((route) => router.use(route));

export const BaseRouter = router;

