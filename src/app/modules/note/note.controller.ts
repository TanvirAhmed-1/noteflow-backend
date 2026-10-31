import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import { NoteServices } from "./note.services";
import { createNoteSchema, updateNoteSchema } from "./note.validation";

// Create Note (User & Admin)
const createNote = catchAsync(async (req, res) => {
  const validatedData = createNoteSchema.parse(req.body);
  const result = await NoteServices.createNoteDB({
    ...validatedData,
    userId: req.user!.id,
  });

  res.status(httpStatus.CREATED).json({
    success: true,
    statusCode: 201,
    message: "Note created successfully",
    result,
  });
});

// Fetch Notes (Paginated & Filtered)
// - Admin: sees everyone's notes by default, or can filter by ?userId=..., ?scope=own, ?type=personal|community
// - Regular user: sees their own notes by default, or community notes when ?type=community
const fetchNotes = catchAsync(async (req, res) => {
  const user = req.user!;
  let filterUserId: string | undefined;

  if (user.role === "admin") {
    if (req.query.scope === "own") {
      filterUserId = user.id;
    } else if (typeof req.query.userId === "string" && req.query.userId.trim()) {
      filterUserId = req.query.userId.trim();
    }
  } else {
    if (req.query.type === "community" && req.query.scope !== "own") {
      filterUserId = undefined;
    } else {
      filterUserId = user.id;
    }
  }

  const result = await NoteServices.fetchNotesDB(req.query, filterUserId);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: 200,
    message: "Notes fetched successfully",
    meta: result.meta,
    result: result.data,
  });
});

// Fetch All Notes (Explicit Admin endpoint to view everyone's notes)
const fetchAllNotesByAdmin = catchAsync(async (req, res) => {
  const filterUserId =
    typeof req.query.userId === "string" && req.query.userId.trim()
      ? req.query.userId.trim()
      : undefined;

  const result = await NoteServices.fetchNotesDB(req.query, filterUserId);

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: 200,
    message: "All users notes fetched successfully",
    meta: result.meta,
    result: result.data,
  });
});

// Get Single Note by ID (User can view own note; Admin can view everyone's note)
const getSingleNote = catchAsync(async (req, res) => {
  const noteId = req.params.noteId as string;
  const note = await NoteServices.fetchSingleNoteDB(noteId);

  const ownerId =
    typeof note.userId === "object" && note.userId !== null && "_id" in note.userId
      ? String((note.userId as any)._id)
      : String(note.userId);

  if (req.user!.role !== "admin" && ownerId !== req.user!.id) {
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      message: "Forbidden: You do not have permission to view this note",
    });
  }

  res.status(httpStatus.OK).json({
    success: true,
    statusCode: 200,
    message: "Note fetched successfully",
    result: note,
  });
});

// Update Note (User can update own note; Admin can update own or any note)
const updateNote = catchAsync(async (req, res) => {
  const noteId = req.params.noteId as string;
  const existingNote = await NoteServices.fetchSingleNoteDB(noteId);

  const ownerId =
    typeof existingNote.userId === "object" &&
    existingNote.userId !== null &&
    "_id" in existingNote.userId
      ? String((existingNote.userId as any)._id)
      : String(existingNote.userId);

  if (req.user!.role !== "admin" && ownerId !== req.user!.id) {
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      message: "Forbidden: You can only update your own notes",
    });
  }

  const validatedData = updateNoteSchema.parse(req.body);
  const result = await NoteServices.updateNoteDB(validatedData, noteId);

  res.status(httpStatus.OK).json({
    success: true,
    message: "Note updated successfully",
    result,
  });
});

// Delete Note (User can delete own note; Admin can delete own or any note)
const deleteNote = catchAsync(async (req, res) => {
  const noteId = req.params.noteId as string;
  const existingNote = await NoteServices.fetchSingleNoteDB(noteId);

  const ownerId =
    typeof existingNote.userId === "object" &&
    existingNote.userId !== null &&
    "_id" in existingNote.userId
      ? String((existingNote.userId as any)._id)
      : String(existingNote.userId);

  if (req.user!.role !== "admin" && ownerId !== req.user!.id) {
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      message: "Forbidden: You can only delete your own notes",
    });
  }

  const result = await NoteServices.deleteNoteDB(noteId);

  res.status(httpStatus.OK).json({
    success: true,
    message: "Note deleted successfully",
    result,
  });
});

export const noteController = {
  createNote,
  fetchNotes,
  fetchAllNotesByAdmin,
  getSingleNote,
  updateNote,
  deleteNote,
};

