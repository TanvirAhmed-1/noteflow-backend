import { Router } from "express";
import { UserController } from "./user.controller";
import { auth } from "../../middlewares/auth.middleware";

const router = Router();

// Public Auth Routes
router.post("/register", UserController.createdUser);
router.post("/login", UserController.loginUser);

// Scenario 1: Group Users by Interests (Admin Only Aggregation Pipeline)
router.get("/users/grouped-by-interests", auth("admin"), UserController.groupUsersByInterests);

// Authenticated User Profile Routes
router.get("/user-profile", auth("user", "admin"), UserController.getMyProfile);
router.put("/update-profile", auth("user", "admin"), UserController.updateUser);
router.put("/change-password", auth("user", "admin"), UserController.changePassword);

// Admin User Management Routes
router.post("/create-admin-user", auth("admin"), UserController.createUserByAdmin);
router.get("/all-users", auth("admin"), UserController.fetchUser);
router.get("/users/:userId", auth("user", "admin"), UserController.getSingleUser);
router.put("/users/:userId", auth("user", "admin"), UserController.updateUser);
router.delete("/users/:userId", auth("admin"), UserController.deleteUser);

export const UserRouter = router;

