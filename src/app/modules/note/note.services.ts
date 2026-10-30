import { NoteModel } from "./note.model";
import { INote } from "./note.interface";

// Create a note
const createNoteDB = async (payload: INote) => {
  const result = await NoteModel.create(payload);
  return result;
};

// Fetch notes with pagination
// - Uses { userId: 1, createdAt: -1 } when filtering by userId (User's own notes)
// - Uses { createdAt: -1 } when Admin fetches everyone's notes (no userId filter)
const fetchNotesDB = async (
  query: Record<string, any> = {},
  filterUserId?: string
) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};
  if (filterUserId) {
    filter.userId = filterUserId;
  }

  const [data, total] = await Promise.all([
    NoteModel.find(filter)
      .populate("userId", "name email role")
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
      totalPage: Math.ceil(total / limit),
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
    throw new Error("Note not found");
  }
  return note;
};

// Update note by ID (Uses built-in { _id: 1 } index)
const updateNoteDB = async (payload: Partial<INote>, noteId: string) => {
  const result = await NoteModel.findByIdAndUpdate(noteId, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};

// Delete note by ID (Uses built-in { _id: 1 } index)
const deleteNoteDB = async (noteId: string) => {
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

