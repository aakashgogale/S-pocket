import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    size: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// 🔐 Security features (your addition — very good)
fileSchema.add({
  encryptedMetadata: {
    iv: String,
    data: String,
    tag: String,
  },
  accessControl: {
    allowedUsers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],
    expiresAt: Date,
    public: { type: Boolean, default: false },
  },
  securityLogs: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      action: String,
      ip: String,
      timestamp: { type: Date, default: Date.now },
      riskScore: Number,
    },
  ],
});

// 🔒 Helper method (useful for your project)
fileSchema.methods.isAccessibleBy = function (userId) {
  if (this.accessControl.public) return true;

  return this.accessControl.allowedUsers.some(
    (id) => id.toString() === userId.toString()
  );
};

// 🔥 Create model
const File = mongoose.model("File", fileSchema);

// 🔥 IMPORTANT (fixes your error)
export default File;