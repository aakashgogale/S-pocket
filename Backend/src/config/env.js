import dotenv from "dotenv";
dotenv.config();

const required = [
  "MONGO_URI",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET"
];

for (const key of required) {
  const value = process.env[key];
  if (!value || !String(value).trim()) {
    throw new Error(`[env] Missing required environment variable: ${key}`);
  }
  process.env[key] = String(value).trim();
}
