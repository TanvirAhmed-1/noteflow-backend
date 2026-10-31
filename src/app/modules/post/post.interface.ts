import { Types } from "mongoose";

export type TPostVisibility = "personal" | "community";

export type IPost = {
  title: string;
  content: string;
  interest?: string | string[];
  type?: TPostVisibility;
  userId: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
};
