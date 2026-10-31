import { Types } from "mongoose";

export type TNoteType = "personal" | "community";

export type INote = {
  title: string;
  content: string;
  type?: TNoteType;
  userId: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
};
