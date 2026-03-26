import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    action: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["success", "fail", "threat"],
      default: "success"
    },
    category: {
      type: String,
      enum: ["Auth", "File", "System"],
      default: "System"
    },
    ipAddress: {
      type: String
    },
    riskLevel: {
      type: String,
      enum: ["Low", "Moderate", "Critical"],
      default: "Low"
    },
    isThreat: {
      type: Boolean,
      default: false
    },
    meta: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

export default mongoose.model("Activity", activitySchema);
