import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import notFoundHandler from "./app/middlewares/notFoundHandler";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import { BaseRouter } from "./app/routes";
import config from "./app/config";

const app = express();

// ✅ Correct CORS configuration
app.use(
  cors({
    origin: [config.frontend_url, "http://localhost:3000", "http://localhost:5173", "http://localhost:5000"],
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
