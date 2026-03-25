import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    action: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: "info"
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
