import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
import verifyToken from "../utils/verifyToken";
import { UserModel } from "../modules/user/user.model";
import { TUserRole } from "../modules/user/user.interface";

export const auth = (...requiredRoles: TUserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized User",
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized: Invalid or expired token",
      });
    }

    // Uses built-in MongoDB { _id: 1 } index
    const user = await UserModel.findById(decoded.id);

    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized: User not found",
      });
    }

    if (
      requiredRoles.length &&
      !requiredRoles.includes(user.role as TUserRole)
    ) {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: "Forbidden: insufficient role",
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role as TUserRole,
    };

    next();
  });
};

