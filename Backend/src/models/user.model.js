
const { create } = require("domain")
const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    fullname: {
        type : String,
        required : [true, "Please enter your full name."],
        trim : true,
    },
    emial : {
        type : String,
        required : [true, "Please enter an email."],
        unique: true,
        lowercase : true,
        trim: true,
    },
    password : {
        type : String,
        required: [true, "Please enter a password"],
        minlength : 8,
        select : false,
    },
    createdAt : {
        type : Date,
        default: Date.now
    }
})

const userModel = mongoose.mongo("users", userSchema)

module.exports = userModel