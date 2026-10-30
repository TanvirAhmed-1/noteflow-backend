import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";

const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwtSecret as string) as JwtPayload;
};

export default verifyToken;
