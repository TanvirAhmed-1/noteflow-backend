import bcrypt from "bcrypt";
import { UserModel } from "../modules/user/user.model";
import config from "../config";

export const seedAdmin = async () => {
  try {
    // Uses { email: 1 } unique index to check if admin already exists
    const adminExists = await UserModel.findOne({
      email: config.admin.email.toLowerCase(),
    });

    if (!adminExists) {
      const saltRounds = config.bcrypt.saltRounds || 10;
      const hashedPassword = await bcrypt.hash(
        config.admin.password,
        saltRounds
      );

      await UserModel.create({
        name: config.admin.name,
        email: config.admin.email.toLowerCase(),
        password: hashedPassword,
        role: "admin",
        interests: ["coding", "reading"],
      });

      console.log(`✅ Admin account seeded successfully (${config.admin.email})`);
    } else {
      console.log("ℹ️ Admin account already exists. Skipping seeding.");
    }
  } catch (error) {
    console.error("❌ Failed to seed Admin:", error);
  }
};

