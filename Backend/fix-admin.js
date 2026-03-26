import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "./src/models/user.model.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI is missing in .env");
  process.exit(1);
}

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    await User.deleteOne({ email: "spocket@secureplatform.gmail.com" });

    const hashedPassword = await bcrypt.hash("Spocket@4Mamber", 10);

    await User.create({
      username: "SpocketProject",
      fullName: "SpocketProject",
      email: "spocket@secureplatform.gmail.com",
      password: hashedPassword,
      role: "admin",
      isVerified: true
    });

    console.log("Admin User Created Successfully");
  } catch (err) {
    console.error("Failed to create admin user:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

run();
