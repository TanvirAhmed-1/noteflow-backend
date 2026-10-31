import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../../config";
import { UserModel } from "./user.model";
import { IUser, loginType } from "./user.interface";

const createUserDB = async (payload: IUser) => {
  // Uses { email: 1 } unique index
  const existingUser = await UserModel.findOne({ email: payload.email.toLowerCase() });
  if (existingUser) {
    throw new Error("User already exist!");
  }

  const saltRounds = config.bcrypt.saltRounds || 10;
  const hashedPassword = await bcrypt.hash(payload.password, saltRounds);
  const result = await UserModel.create({
    ...payload,
    email: payload.email.toLowerCase(),
    password: hashedPassword,
  });

  const jwtPayload = {
    id: result._id.toString(),
    email: result.email,
    name: result.name,
    role: result.role,
  };

  const token = jwt.sign(jwtPayload, config.jwtSecret as string, {
    expiresIn: config.jwtExpiresIn as any,
  });

  const refreshToken = jwt.sign(
    jwtPayload,
    config.refreshTokenSecret as string,
    {
      expiresIn: config.refreshTokenExpiresIn as any,
    }
  );

  const userObj = result.toObject();
  delete (userObj as any).password;
  return {
    ...userObj,
    id: result._id.toString(),
    token,
    refreshToken,
  };
};

// Admin list all users with pagination, search, role & active filter (Uses { createdAt: -1 } index)
const fetchUserDB = async (query: Record<string, any> = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};

  if (query.searchTerm && String(query.searchTerm).trim() !== "") {
    const regex = new RegExp(String(query.searchTerm).trim(), "i");
    filter.$or = [{ name: regex }, { email: regex }];
  }

  if (query.role && (query.role === "admin" || query.role === "user")) {
    filter.role = query.role;
  }

  if (query.isActive === "true") {
    filter.isActive = { $ne: false };
  } else if (query.isActive === "false") {
    filter.isActive = false;
  }

  const [data, total] = await Promise.all([
    UserModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    UserModel.countDocuments(filter),
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

// Read single user profile by ID (Uses built-in { _id: 1 } index)
const fetchSingleUserDB = async (userId: string) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

// Update user by ID (Uses built-in { _id: 1 } index)
const updateUserDB = async (payload: Partial<IUser>, userId: string) => {
  const existingUser = await UserModel.findById(userId);
  if (!existingUser) {
    throw new Error("User not found");
  }

  const updateData: Partial<IUser> = { ...payload };
  if (updateData.password) {
    const saltRounds = config.bcrypt.saltRounds || 10;
    updateData.password = await bcrypt.hash(updateData.password, saltRounds);
  }

  const result = await UserModel.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });
  return result;
};

// Delete user by ID (Uses built-in { _id: 1 } index)
const deleteUserDB = async (userId: string) => {
  const existingUser = await UserModel.findById(userId);
  if (!existingUser) {
    throw new Error("User not found");
  }

  const result = await UserModel.findByIdAndDelete(userId);
  return result;
};

// Login user (Uses { email: 1 } index)
const loginDB = async (payload: loginType) => {
  const user = await UserModel.findOne({ email: payload.email.toLowerCase() }).select("+password");

  if (!user) {
    throw new Error("User not found");
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  const jwtPayload = {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const accesstoken = jwt.sign(
    jwtPayload,
    config.jwtSecret as string,
    {
      expiresIn: config.jwtExpiresIn as any,
    }
  );

  const refreshToken = jwt.sign(
    jwtPayload,
    config.refreshTokenSecret as string,
    {
      expiresIn: config.refreshTokenExpiresIn as any,
    }
  );

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    interests: user.interests,
    token: accesstoken,
    refreshToken,
  };
};

// ✅ Scenario 1: Group by Interests
// Constraint: Exactly ONE collection.aggregate() call. Do not use any other methods.
// Uses multikey index { interests: 1 } via initial $match stage
const groupUsersByInterestsDB = async (query: Record<string, any> = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;

  const aggregationResult = await UserModel.aggregate([
    // Stage 1: Filter users with non-empty interests using { interests: 1 } multikey index
    {
      $match: {
        interests: { $gt: "" },
      },
    },
    // Stage 2: Deconstruct the interests array
    {
      $unwind: "$interests",
    },
    // Stage 3: Group users by interest
    {
      $group: {
        _id: "$interests",
        totalUsers: { $sum: 1 },
        users: {
          $push: {
            _id: "$_id",
            name: "$name",
            email: "$email",
            role: "$role",
          },
        },
      },
    },
    // Stage 4: Format fields
    {
      $project: {
        _id: 0,
        interest: "$_id",
        totalUsers: 1,
        users: 1,
      },
    },
    // Stage 5: Sort alphabetically by interest name
    {
      $sort: { interest: 1 },
    },
    // Stage 6: Paginate within the single aggregate() call
    {
      $facet: {
        meta: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    },
  ]);

  const facetResult = aggregationResult[0] || { meta: [], data: [] };
  const total = facetResult.meta[0]?.total || 0;

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: facetResult.data,
  };
};

// Change Password (Uses built-in { _id: 1 } index)
const changePasswordDB = async (
  userId: string,
  payload: { currentPassword: string; newPassword: string }
) => {
  const user = await UserModel.findById(userId).select("+password");
  if (!user) {
    throw new Error("User not found");
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.currentPassword,
    user.password
  );
  if (!isPasswordMatched) {
    throw new Error("Current password does not match");
  }

  const saltRounds = config.bcrypt.saltRounds || 10;
  const hashedNewPassword = await bcrypt.hash(payload.newPassword, saltRounds);

  await UserModel.findByIdAndUpdate(userId, {
    password: hashedNewPassword,
  });

  return { updated: true };
};

export const UserServices = {
  createUserDB,
  fetchUserDB,
  fetchSingleUserDB,
  updateUserDB,
  deleteUserDB,
  loginDB,
  groupUsersByInterestsDB,
  changePasswordDB,
};

