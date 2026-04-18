import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// 🔐 Security fields (your addition — good)
userSchema.add({
  mfaSecret: {
    type: String,
    default: null,
    select: false, // hidden in queries
  },
  accessLogs: [
    {
      ip: String,
      endpoint: String,
      timestamp: { type: Date, default: Date.now },
      riskScore: { type: Number, default: 0 },
      userAgent: String,
    },
  ],
  failedLoginAttempts: {
    type: Number,
    default: 0,
  },
  lockedUntil: {
    type: Date,
  },
});

// 🔒 Optional: helper method (very useful for your project)
userSchema.methods.isLocked = function () {
  return this.lockedUntil && this.lockedUntil > Date.now();
};

// 🔥 Create model
const User = mongoose.model("User", userSchema);

// 🔥 IMPORTANT (fixes your error)
export default User;