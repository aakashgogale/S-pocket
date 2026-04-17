import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const assertCloudinaryConfig = () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary credentials are missing");
  }
};

export const uploadToCloudinary = ({ buffer, folder, filename, resourceType = "auto" }) => {
  assertCloudinaryConfig();
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: filename
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
          resourceType: result.resource_type
        });
      }
    );
    upload.end(buffer);
  });
};

export const uploadProfileImage = async (buffer, filename) => {
  const result = await uploadToCloudinary({
    buffer,
    folder: "profile_pics",
    filename,
    resourceType: "image"
  });
  return result.secureUrl;
};

export const uploadFileAsset = async (buffer, filename) => {
  return uploadToCloudinary({
    buffer,
    folder: "secure_files",
    filename,
    resourceType: "auto"
  });
};

export const destroyAsset = async (publicId, resourceType = "image") => {
  if (!publicId) return;
  assertCloudinaryConfig();
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true
  });
};
