import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { InterestModel } from "./interest.model";
import { IInterest } from "./interest.interface";


// its defoult if you need to remove it , admin create this
const DEFAULT_INTERESTS = [
  { title: "Coding", description: "Software development, algorithms, and clean code", color: "bg-indigo-600", status: "published" },
  { title: "Technology", description: "Modern gadgets, hardware, and tech innovations", color: "bg-blue-600", status: "published" },
  { title: "AI & ML", description: "Artificial Intelligence, neural networks, and LLMs", color: "bg-violet-600", status: "published" }
];

const ensureDefaultInterests = async () => {
  const count = await InterestModel.countDocuments();
  if (count === 0) {
    await InterestModel.insertMany(DEFAULT_INTERESTS);
  }
};

// Create an interest
const createInterestDB = async (payload: IInterest) => {
  const existing = await InterestModel.findOne({
    title: { $regex: new RegExp(`^${payload.title.trim()}$`, "i") },
  });

  if (existing) {
    throw new AppError(
      httpStatus.CONFLICT,
      `Interest topic "${payload.title}" already exists`
    );
  }

  const result = await InterestModel.create({
    ...payload,
    title: payload.title.trim(),
  });
  return result;
};

// Fetch interests with searching, status filtering, and pagination
const fetchInterestsDB = async (query: Record<string, unknown> = {}) => {
  await ensureDefaultInterests();

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  // Status Filter
  if (
    query.status &&
    String(query.status).trim() !== "" &&
    String(query.status).toLowerCase() !== "all"
  ) {
    filter.status = String(query.status).trim().toLowerCase();
  }

  // Search Filter (by title or description)
  if (query.searchTerm && String(query.searchTerm).trim() !== "") {
    const searchRegex = new RegExp(String(query.searchTerm).trim(), "i");
    filter.$or = [{ title: searchRegex }, { description: searchRegex }];
  }

  const [data, total] = await Promise.all([
    InterestModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    InterestModel.countDocuments(filter),
  ]);

  const totalPage = Math.ceil(total / limit) || 1;

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    data,
  };
};

// Get single interest
const getSingleInterestDB = async (id: string) => {
  const result = await InterestModel.findById(id).lean();
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Interest not found");
  }
  return result;
};

// Update interest
const updateInterestDB = async (id: string, payload: Partial<IInterest>) => {
  if (payload.title) {
    const existing = await InterestModel.findOne({
      _id: { $ne: id },
      title: { $regex: new RegExp(`^${payload.title.trim()}$`, "i") },
    });
    if (existing) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Interest topic "${payload.title}" already exists`
      );
    }
  }

  const result = await InterestModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Interest not found");
  }
  return result;
};

// Delete interest
const deleteInterestDB = async (id: string) => {
  const result = await InterestModel.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Interest not found");
  }
  return result;
};

export const InterestServices = {
  createInterestDB,
  fetchInterestsDB,
  getSingleInterestDB,
  updateInterestDB,
  deleteInterestDB,
};
