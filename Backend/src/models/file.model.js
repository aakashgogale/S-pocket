import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    filename: {
      type: String
    },
    originalName: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    fileType: {
      type: String
    },
    mimeType: {
      type: String
    },
    size: {
      type: String,
      required: true
    },
    bytes: {
      type: Number
    },
    url: {
      type: String
    },
    cloudinaryPublicId: {
      type: String
    },
    cloudinaryResourceType: {
      type: String
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low"
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    downloadHistory: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("File", fileSchema);
