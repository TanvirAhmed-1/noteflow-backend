import { Types } from "mongoose";

export type INote = {
  title: string;
  content: string;
  userId: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
};

