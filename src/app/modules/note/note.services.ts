import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { NoteModel } from "./note.model";
import { UserModel } from "../user/user.model";
import { INote } from "./note.interface";

// Create a note
const createNoteDB = async (payload: INote) => {
  const result = await NoteModel.create(payload);
  return result.populate("userId", "name email role");
};

// Fetch notes with pagination & rich filtering (type, searchTerm, userName, date, userId)
const fetchNotesDB = async (
  query: Record<string, any> = {},
  filterUserId?: string
) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 12);
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};

  if (filterUserId) {
    filter.userId = filterUserId;
  }

  // Filter by note type: "personal" | "community"
  if (query.type === "personal") {
    // Include legacy notes where type was not set yet as "personal"
    filter.$and = [
      ...(filter.$and || []),
      { $or: [{ type: "personal" }, { type: { $exists: false } }] },
    ];
  } else if (query.type === "community") {
    filter.type = "community";
  }

  // Filter by author name/email if provided
  if (query.userName && String(query.userName).trim() !== "") {
    const userRegex = new RegExp(String(query.userName).trim(), "i");
    const matchedUsers = await UserModel.find({
      $or: [{ name: userRegex }, { email: userRegex }],
    }).select("_id");
    const matchedIds = matchedUsers.map((u) => u._id);
    filter.userId = filterUserId
      ? { $in: matchedIds.filter((id) => String(id) === String(filterUserId)) }
      : { $in: matchedIds };
  }

  // Filter by search term (matches title, content, or author name)
  if (query.searchTerm && String(query.searchTerm).trim() !== "") {
    const searchRegex = new RegExp(String(query.searchTerm).trim(), "i");
    const matchedUsers = await UserModel.find({
      $or: [{ name: searchRegex }, { email: searchRegex }],
    }).select("_id");
    const matchedUserIds = matchedUsers.map((u) => u._id);

    const searchOr: Record<string, any>[] = [
      { title: searchRegex },
      { content: searchRegex },
    ];
    if (!filterUserId && matchedUserIds.length > 0) {
      searchOr.push({ userId: { $in: matchedUserIds } });
    }

    filter.$and = [...(filter.$and || []), { $or: searchOr }];
  }

  // Filter by specific date (YYYY-MM-DD)
  if (query.date && String(query.date).trim() !== "") {
    const dateStr = String(query.date).trim();
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
    if (!isNaN(startOfDay.getTime()) && !isNaN(endOfDay.getTime())) {
      filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }
  }

  const [data, total] = await Promise.all([
    NoteModel.find(filter)
      .populate("userId", "name email role interests")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    NoteModel.countDocuments(filter),
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

// Read single note by ID (Uses built-in { _id: 1 } index)
const fetchSingleNoteDB = async (noteId: string) => {
  const note = await NoteModel.findById(noteId).populate(
    "userId",
    "name email role"
  );
  if (!note) {
    throw new AppError(httpStatus.NOT_FOUND, "Note not found");
  }
  return note;
};

// Update note by ID (Uses built-in { _id: 1 } index)
const updateNoteDB = async (payload: Partial<INote>, noteId: string) => {
  const isExists = await NoteModel.findById(noteId);
  if (!isExists) {
    throw new AppError(httpStatus.NOT_FOUND, "Note not found");
  }

  const result = await NoteModel.findByIdAndUpdate(noteId, payload, {
    new: true,
    runValidators: true,
  }).populate("userId", "name email role");
  return result;
};

// Delete note by ID (Uses built-in { _id: 1 } index)
const deleteNoteDB = async (noteId: string) => {
  const isExists = await NoteModel.findById(noteId);
  if (!isExists) {
    throw new AppError(httpStatus.NOT_FOUND, "Note not found");
  }

  const result = await NoteModel.findByIdAndDelete(noteId);
  return result;
};

export const NoteServices = {
  createNoteDB,
  fetchNotesDB,
  fetchSingleNoteDB,
  updateNoteDB,
  deleteNoteDB,
};
