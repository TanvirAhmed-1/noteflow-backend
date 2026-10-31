import { Router } from "express";
import { interestController } from "./interest.controller";
import { auth } from "../../middlewares/auth.middleware";

const route = Router();

// Public to all users (so community post form & filters can fetch interests without restriction)
route.get("/interests", interestController.fetchInterests);
route.get("/interests/:interestId", interestController.getSingleInterest);

// Admin-only management routes
route.post("/interests", auth("admin"), interestController.createInterest);
route.put("/interests/:interestId", auth("admin"), interestController.updateInterest);
route.patch("/interests/:interestId/status", auth("admin"), interestController.toggleStatus);
route.delete("/interests/:interestId", auth("admin"), interestController.deleteInterest);

export const interestRoute = route;

