import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import { UserServices } from "./user.services";
import {
  changePasswordSchema,
  createUserSchema,
  loginSchema,
  updateUserSchema,
} from "./user.validation";

// Register User (Public)
const createdUser = catchAsync(async (req, res) => {
  const validatedData = createUserSchema.parse(req.body);
  // Regular registration always creates "user" unless first/explicitly allowed, or if role is provided
  const result = await UserServices.createUserDB(validatedData);
  res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: 201,
    message: "User created successfully",
    result,
  });
});

// Admin Add User
const createUserByAdmin = catchAsync(async (req, res) => {
  const validatedData = createUserSchema.parse(req.body);
  const result = await UserServices.createUserDB(validatedData);
  res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: 201,
    message: "User created successfully by admin",
    result,
  });
});

// Admin List All Users (Paginated)
const fetchUser = catchAsync(async (req, res) => {
  const result = await UserServices.fetchUserDB(req.query);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: 200,
    message: "Users fetched successfully",
    meta: result.meta,
    result: result.data,
  });
});

// Get Own Profile
const getMyProfile = catchAsync(async (req, res) => {
  const userId = req.user!.id;
  const result = await UserServices.fetchSingleUserDB(userId);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: 200,
    message: "User profile fetched successfully",
    result,
  });
});

// Get Single User by ID
const getSingleUser = catchAsync(async (req, res) => {
  const userId = req.params.userId as string;
  const result = await UserServices.fetchSingleUserDB(userId);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: 200,
    message: "User fetched successfully",
    result,
  });
});

// Update User by ID (Admin can update any user; User can update own profile)
const updateUser = catchAsync(async (req, res) => {
  const userId = (req.params.userId as string) || req.user!.id;

  if (req.user!.role !== "admin" && req.user!.id !== userId) {
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      message: "Forbidden: You can only update your own profile",
    });
  }

  const validatedData = updateUserSchema.parse(req.body);
  // Prevent non-admin from escalating their own role
  if (req.user!.role !== "admin") {
    delete validatedData.role;
  }

  const result = await UserServices.updateUserDB(validatedData, userId);
  res.status(httpStatus.OK).json({
    success: true,
    message: "User updated successfully",
    result,
  });
});

// Delete User by ID (Admin only)
const deleteUser = catchAsync(async (req, res) => {
  const userId = req.params.userId as string;
  const result = await UserServices.deleteUserDB(userId);
  res.status(httpStatus.OK).json({
    success: true,
    message: "User deleted successfully",
    result,
  });
});

// Login User
const loginUser = catchAsync(async (req, res) => {
  const loginValidation = loginSchema.parse(req.body);
  const result = await UserServices.loginDB(loginValidation);

  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: "User logged in successfully",
    result,
  });
});

// Scenario 1: Group Users by Interests (Single aggregate() call)
const groupUsersByInterests = catchAsync(async (req, res) => {
  const result = await UserServices.groupUsersByInterestsDB(req.query);
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: 200,
    message: "Users grouped by interests fetched successfully",
    meta: result.meta,
    result: result.data,
  });
});

// Change Password (Authenticated User / Admin)
const changePassword = catchAsync(async (req, res) => {
  const validatedData = changePasswordSchema.parse(req.body);
  const result = await UserServices.changePasswordDB(
    req.user!.id,
    validatedData
  );
  res.status(httpStatus.OK).json({
    success: true,
    statusCode: 200,
    message: "Password changed successfully",
    result,
  });
});

export const UserController = {
  createdUser,
  createUserByAdmin,
  fetchUser,
  getMyProfile,
  getSingleUser,
  updateUser,
  deleteUser,
  loginUser,
  groupUsersByInterests,
  changePassword,
};

