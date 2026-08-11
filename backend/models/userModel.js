import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {type: String, required: true, unique: true, lowercase: true, trim: true},
    password: {type: String, required: true},
    role: {type: String, enum: ["ADMIN", "EMPLOYEE"], default: "EMPLOYEE"},
    refreshToken: {type: String, default: null},
    passwordResetOTP: {type: String, default: null},
    passwordResetOTPExpires: {type: Date,default: null}
}, {timestamps: true, versionKey: false})


const User = mongoose.model("User", userSchema)

export default User