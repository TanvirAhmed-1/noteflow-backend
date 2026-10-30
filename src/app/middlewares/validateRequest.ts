import { NextFunction, Request, Response } from "express";
import { ZodError, ZodTypeAny } from "zod";
import httpStatus from "http-status";

const validateRequest = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies,
      })) as any;

      req.body = parsed.body || req.body;
      req.query = parsed.query || req.query;
      req.params = parsed.params || req.params;

      next();
    } catch (error: any) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue) => ({
          field: issue.path.join(".").replace(/^(body|query|params)\./, ""),
          message: issue.message,
        }));

        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          statusCode: httpStatus.BAD_REQUEST,
          message: "Validation failed",
          errors: formattedErrors,
        });
      }

      next(error);
    }
  };
};

export default validateRequest;

