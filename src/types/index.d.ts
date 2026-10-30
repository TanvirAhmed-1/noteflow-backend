// src/types/index.d.ts
declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      email: string;
      role: "user" | "admin";
      name: string;
    };
  }
}

