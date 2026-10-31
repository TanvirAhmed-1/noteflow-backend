import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import notFoundHandler from "./app/middlewares/notFoundHandler";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import { BaseRouter } from "./app/routes";
import config from "./app/config";

const app = express();

const allowedOrigins = [
  ...config.frontend_url,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev/interview to avoid blocking any frontend domain
      }
    },
    credentials: true,
  })
);

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Routes
app.use("/api", BaseRouter);

app.get("/", (req, res) => {
  res.send("Server running successfully!");
});

// ✅ Global error handler
app.use(globalErrorHandler);

// ✅ 404 Not Found handler
app.use(notFoundHandler);

export default app;
