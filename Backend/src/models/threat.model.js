import mongoose from "mongoose";

const threatSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  description: {
    type: String
  },

  severity: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "low"
  },

  type: {
    type: String, // malware, ddos, suspicious_login etc.
    required: true
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  metadata: {
    ip: String,
    location: String,
    device: String
  },

  status: {
    type: String,
    enum: ["open", "investigating", "resolved"],
    default: "open"
  }

}, { timestamps: true });


threatSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model("Threat", threatSchema);