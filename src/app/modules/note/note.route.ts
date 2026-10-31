import { Router } from "express";
import { noteController } from "./note.controller";
import { auth } from "../../middlewares/auth.middleware";

const route = Router();

route.post("/notes", auth("user", "admin"), noteController.createNote);
route.get("/notes", auth("user", "admin"), noteController.fetchNotes);
route.get("/notes/all", auth("admin"), noteController.fetchAllNotesByAdmin);
route.get("/notes/:noteId", auth("user", "admin"), noteController.getSingleNote);
route.put("/notes/:noteId", auth("user", "admin"), noteController.updateNote);
route.delete("/notes/:noteId", auth("user", "admin"), noteController.deleteNote);

export const noteRoute = route;

