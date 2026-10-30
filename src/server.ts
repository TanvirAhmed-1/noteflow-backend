import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import config from "./app/config";
import { seedAdmin } from "./app/seed";

async function main() {
  try {
    await mongoose.connect(config.database.url as string);
    console.log("MongoDB connected successfully");

    // Automatically seed admin if not present
    await seedAdmin();

    const server: Server = app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });

    const exitHandler = () => {
      if (server) {
        server.close(() => {
          console.log("Server closed");
        });
      }
      process.exit(1);
    };

    const unexpectedErrorHandler = (error: unknown) => {
      console.error(error);
      exitHandler();
    };

    process.on("uncaughtException", unexpectedErrorHandler);
    process.on("unhandledRejection", unexpectedErrorHandler);
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  }
}

main();
