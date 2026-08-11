import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../config/token.js";
import User from "../models/userModel.js";
import Employee from "../models/employeeModel.js";
import bcrypt from "bcrypt";
import sendEmail from "../config/sendEmail.js"
import crypto from "crypto"
import validator from "validator"



export const loginUser = async (data) => {
  const { email, password, role_type } = data;

  if (!email || !password) {
    throw new Error("Invalid email or password");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (role_type === "admin" && user.role !== "ADMIN") {
    throw new Error("Not authorized as admin");
  }
  if (role_type === "employee" && user.role !== "EMPLOYEE") {
    throw new Error("Not authorized as employee");
  }

  if (user.role === "EMPLOYEE") {
    const employee = await Employee.findOne({ userId: user._id });
    if (employee && (employee.isDeleted || employee.employeeStatus === "Inactive")) {
      throw new Error("Your account has been deactivated. Please contact administrator.");
    }
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  const accessToken = generateAccessToken(user.email, user._id, user.role);

  const refreshToken = generateRefreshToken(user.email, user._id, user.role);

  user.refreshToken = refreshToken;
  await user.save();

  return {
    accessToken,
    refreshToken,
  };
};


export const changePassword = async (userId, data) => {
  const { currentPassword, newPassword } = data;

  if (!currentPassword || !newPassword) {
    throw new Error("Both passwords are required");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    throw new Error("Password incorrect");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.findByIdAndUpdate(userId, {
    password: hashedPassword,
    refreshToken: null,
  });

  return {
    success: true,
    message: "Password changed successfully",
  };
};


export const refreshToken = async (data) => {
  const { refreshToken } = data;

  if (!refreshToken) {
    throw new Error("Refresh token is required");
  }

  const decoded = verifyRefreshToken(refreshToken);

  if (!decoded) {
    throw new Error("Invalid refresh token");
  }

  const user = await User.findById(decoded.userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.refreshToken !== refreshToken) {
    throw new Error("Refresh token is invalid");
  }

  const accessToken = generateAccessToken(user.email, user._id, user.role);

  const newRefreshToken = generateRefreshToken(user.email, user._id, user.role);

  user.refreshToken = newRefreshToken;

  await user.save();

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};


export const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    refreshToken: null,
  });

  return {
    success: true,
    message: "Logout successful",
  };
};


export const sendPasswordResetOTP = async (email) => {

    if (!email) {
        throw new Error("Invalid email or password");
    }

    if (!validator.isEmail(email)) {
        throw new Error("Invalid email or password");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new Error("Invalid email or password");
    }

    // Generate 6 digit OTP
    const otp = crypto
        .randomInt(100000, 1000000)
        .toString();

    // OTP valid for 10 minutes
    const otpExpires = new Date(
        Date.now() + 5 * 60 * 1000
    );

    const hashedOTP = await bcrypt.hash(otp, 10);
    user.passwordResetOTP = hashedOTP;
    user.passwordResetOTPExpires = otpExpires;

    await user.save();

    await sendEmail(user.email, "Your OTP code", `Your OTP code for reset password is ${otp}`);

    return {
        success: true,
        message: "Password reset OTP sent successfully"
    };
};


export const verifyPasswordResetOTP = async (email, otp) => {

    if (!email || !otp) {
        throw new Error("Email and OTP are required");
    }

    if (!validator.isEmail(email)) {
        throw new Error("Invalid email address");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new Error("No account found with this email");
    }

    if (!user.passwordResetOTP) {
        throw new Error("OTP not found or expired");
    }

    if (!user.passwordResetOTPExpires || user.passwordResetOTPExpires < new Date()) {

        user.passwordResetOTP = null;
        user.passwordResetOTPExpires = null;

        await user.save();

        throw new Error("OTP has expired");
    }

    const isOTPValid = await bcrypt.compare(otp, user.passwordResetOTP);
    if (!isOTPValid) {
        throw new Error("Invalid OTP");
    }

    return {
        success: true,
        message: "OTP verified successfully"
    };
};


export const resetEmployeePassword = async (email, otp, newPassword) => {

    if (!email || !otp || !newPassword) {
        throw new Error("Email, OTP and new password are required");
    }

    if (!validator.isEmail(email)) {
        throw new Error("Invalid email address");
    }

    if (newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters long");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new Error("No account found with this email");
    }

    if (!user.passwordResetOTP) {
        throw new Error("OTP not found or expired");
    }

    if (!user.passwordResetOTPExpires || user.passwordResetOTPExpires < new Date()) {

        user.passwordResetOTP = null;
        user.passwordResetOTPExpires = null;

        await user.save();

        throw new Error("OTP has expired");
    }

    const isOTPValid = await bcrypt.compare(otp, user.passwordResetOTP);
    if (!isOTPValid) {
        throw new Error("Invalid OTP");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    // Remove OTP after successful reset
    user.passwordResetOTP = null;
    user.passwordResetOTPExpires = null;

    // Invalidate existing refresh token
    user.refreshToken = null;

    await user.save();

    return {
        success: true,
        message: "Password reset successfully"
    };
};