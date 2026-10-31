import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import { ZodError } from "zod";
import config from "../config";

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Global Error:", err);

  let statusCode: number = err.statusCode || 500;
  let message: string = err.message || "Something went wrong";

  // MongoDB duplicate key error (E11000)
  if (err?.code === 11000) {
    statusCode = httpStatus.CONFLICT;
    const targetFields = err.keyValue ? Object.keys(err.keyValue) : [];
    message = targetFields.length
      ? `Duplicate field value: ${targetFields.join(", ")}`
      : "Duplicate field value detected";
  }
  // Mongoose CastError (invalid ObjectId)
  else if (err?.name === "CastError") {
    statusCode = httpStatus.BAD_REQUEST;
    message = `Invalid ${err.path}: ${err.value}`;
  }
  // Mongoose ValidationError
  else if (err?.name === "ValidationError") {
    statusCode = httpStatus.BAD_REQUEST;
    message = Object.values(err.errors || {})
      .map((val: any) => val.message)
      .join(", ");
  }
  // Zod validation error
  else if (err instanceof ZodError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = err.issues.map((issue) => issue.message).join(", ");
  }
  // Other JS errors
  else if (err instanceof Error) {
    message = err.message;
  }

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
};

export default globalErrorHandler;

