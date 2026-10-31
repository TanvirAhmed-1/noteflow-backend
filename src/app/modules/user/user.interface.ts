export type TUserRole = "user" | "admin";

export type IUser = {
  name: string;
  email: string;
  password: string;
  role: TUserRole;
  isActive?: boolean;
  interests?: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type loginType = {
  email: string;
  password: string;
};

