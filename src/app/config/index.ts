import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const required = (value: string | undefined, key: string): string => {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  database: {
    url: required(process.env.DATABASE_URL, "DATABASE_URL"),
  },
  bcrypt: {
    saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
  },
  jwtSecret: required(process.env.TOKEN_SECRET_KEY, "TOKEN_SECRET_KEY"),
  refreshTokenSecret: required(
    process.env.REFRESHTOKEN_SECRET_KEY,
    "REFRESHTOKEN_SECRET_KEY"
  ),
  frontend_url: process.env.FRONTEND_URL || "http://localhost:3000",
  admin: {
    name: process.env.ADMIN_NAME || "Admin",
    email: required(process.env.ADMIN_EMAIL, "ADMIN_EMAIL"),
    password: required(process.env.ADMIN_PASSWORD, "ADMIN_PASSWORD"),
  },
};

export default config;

