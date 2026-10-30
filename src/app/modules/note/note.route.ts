import { Router } from "express";
import { noteController } from "./note.controller";
import { auth } from "../../middlewares/auth.middleware";

const route = Router();

route.use(auth("user", "admin"));

route.post("/notes", noteController.createNote);
route.get("/notes", noteController.fetchNotes);
route.get("/notes/all", auth("admin"), noteController.fetchAllNotesByAdmin);
route.get("/notes/:noteId", noteController.getSingleNote);
route.put("/notes/:noteId", noteController.updateNote);
route.delete("/notes/:noteId", noteController.deleteNote);

export const noteRoute = route;

