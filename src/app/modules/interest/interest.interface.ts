import { Types } from "mongoose";

export type TInterestStatus = "published" | "draft";

export interface IInterest {
  title: string;
  description?: string;
  status: TInterestStatus;
  color?: string;
  createdBy?: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}

