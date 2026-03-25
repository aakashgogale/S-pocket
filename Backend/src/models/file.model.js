import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    size: {
      type: String,
      required: true
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
