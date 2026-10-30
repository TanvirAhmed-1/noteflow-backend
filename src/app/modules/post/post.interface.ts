import { Types } from "mongoose";

export type IPost = {
  title: string;
  content: string;
  userId: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
};

