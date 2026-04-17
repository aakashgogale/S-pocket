// const mongoose = require("mongoose")

// const userSchema = new mongoose.Schema({
//     username: {
//         type : String,
//         required : [true, "Please enter your full name."],
//         unique : [true, "Username must be unique"]
//     },
//     email : {
//         type : String,
//         required : [true, "Please enter an email."],
//         unique: [true, "Eamil must be unique"],
//         lowercase : true,
//         trim: true,
//     },
//     password : {
//         type : String,
//         required: [true, "Please enter a password"],
//         minlength : 8,
//     },
//     createdAt : {
//         type : Date,
//         default: Date.now
//     }
// })

// const userModel = mongoose.model("users", userSchema)

// module.exports = userModel


import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: [true, "Username must be unique"],
    trim: true
  },
  fullName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: [true, "User Email is required"],
    unique: [true, "User Email must be unique"],
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, "Password is required"]
  },
  authProvider: {
    type: String,
    enum: ["local", "google"],
    default: "local"
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedAt: {
    type: Date
  },
  lastLogin: {
    type: Date
  },
  lastUserAgent: {
    type: String
  },
  profilePic: {
    type: String
  },
  avatar: {
    type: String
  },
  location: {
    type: String
  },
  bio: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const userModel = mongoose.model("users", userSchema);

export default userModel;
