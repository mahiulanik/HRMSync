import {generateAccessToken, generateRefreshToken, verifyRefreshToken} from "../config/token.js";
import User from "../models/userModel.js";
import Employee from "../models/employeeModel.js";
import bcrypt from "bcrypt";
import sendEmail from "../config/sendEmail.js"
import crypto from "crypto"
import AppError from "../utils/AppError.js";



export const loginUser = async (data) => {
    const { email, password, role_type } = data;

    const user = await User.findOne({
        email: email.toLowerCase()
    });

    if (!user) {
        throw new AppError("Invalid email or password", 401);
    }

    if (role_type === "admin" && user.role !== "ADMIN") {
        throw new AppError("Not authorized as admin", 403);
    }

    if (role_type === "employee" && user.role !== "EMPLOYEE") {
        throw new AppError("Not authorized as employee", 403);
    }

    if (user.role === "EMPLOYEE") {
        const employee = await Employee.findOne({
            userId: user._id
        });

        if (employee && (employee.isDeleted || employee.employeeStatus === "Inactive")) {
            throw new AppError("Your account has been deactivated. Please contact administrator.", 403);
        }
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
        throw new AppError("Invalid email or password", 401);
    }

    const accessToken = generateAccessToken(
        user.email,
        user._id,
        user.role
    );

    const refreshToken = generateRefreshToken(
        user.email,
        user._id,
        user.role
    );

    user.refreshToken = refreshToken;

    await user.save();

    return {
        accessToken,
        refreshToken
    };
};


export const changePassword = async (userId, data) => {
    const { currentPassword, newPassword } = data;

    const user = await User.findById(userId);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
        throw new AppError("Password incorrect", 401);
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


export const refreshToken = async (refreshToken) => {

    if (!refreshToken) {
        throw new AppError("Refresh token is required", 401);
    }

    let decoded;

    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
        throw new AppError("Invalid refresh token", 401);
    }

    if (!decoded) {
        throw new AppError("Invalid refresh token", 401);
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    if (user.refreshToken !== refreshToken) {
        throw new AppError("Refresh token is invalid", 401);
    }

    const accessToken = generateAccessToken(
        user.email,
        user._id,
        user.role
    );

    const newRefreshToken = generateRefreshToken(
        user.email,
        user._id,
        user.role
    );

    user.refreshToken = newRefreshToken;

    await user.save();

    return {
        accessToken,
        refreshToken: newRefreshToken,
    };
};


export const logoutUser = async (userId) => {

    const user = await User.findByIdAndUpdate(
        userId,
        {
            refreshToken: null,
        },
        {
            returnDocument: "after",
        }
    );

    if (!user) {
        throw new AppError("User not found", 404);
    }
    return {
        success: true,
        message: "Logout successful",
    };
};


export const sendPasswordResetOTP = async (email) => {

    const user = await User.findOne({
        email: email.toLowerCase()
    });

    if (!user) {
        throw new AppError("Invalid email", 404);
    }

    // Generate 6 digit OTP
    const otp = crypto
        .randomInt(100000, 1000000)
        .toString();

    // OTP valid for 5 minutes
    const otpExpires = new Date(
        Date.now() + 5 * 60 * 1000
    );

    const hashedOTP = await bcrypt.hash(otp, 10);

    user.passwordResetOTP = hashedOTP;
    user.passwordResetOTPExpires = otpExpires;

    await user.save();

    await sendEmail(
        user.email,
        "Password Reset OTP",
        `
            <p>Your password reset OTP for <strong>HRMSync</strong> is:</p>
            <p><strong style="font-size: 24px;">${otp}</strong></p>
            <p>This OTP is valid for 5 minutes.</p>
        `
    );

    return {
        success: true,
        message: "Password reset OTP sent successfully"
    };
};


export const verifyPasswordResetOTP = async (email, otp) => {

    const user = await User.findOne({
        email: email.toLowerCase()
    });

    if (!user) {
        throw new AppError("No account found with this email", 404);
    }

    if (!user.passwordResetOTP) {
        throw new AppError("OTP not found or expired", 400);
    }

    if (!user.passwordResetOTPExpires || user.passwordResetOTPExpires < new Date()) {
        user.passwordResetOTP = null;
        user.passwordResetOTPExpires = null;

        await user.save();

        throw new AppError("OTP has expired", 400);
    }

    const isOTPValid = await bcrypt.compare(otp, user.passwordResetOTP);

    if (!isOTPValid) {
        throw new AppError("Invalid OTP", 400);
    }

    return {
        success: true,
        message: "OTP verified successfully"
    };
};


export const resetEmployeePassword = async (email, otp, newPassword) => {

    const user = await User.findOne({
        email: email.toLowerCase()
    });

    if (!user) {
        throw new AppError("No account found with this email", 404);
    }

    if (!user.passwordResetOTP) {
        throw new AppError("OTP not found or expired", 400);
    }

    if (!user.passwordResetOTPExpires || user.passwordResetOTPExpires < new Date()) {
        user.passwordResetOTP = null;
        user.passwordResetOTPExpires = null;

        await user.save();

        throw new AppError("OTP has expired", 400);
    }

    const isOTPValid = await bcrypt.compare(otp, user.passwordResetOTP);

    if (!isOTPValid) {
        throw new AppError("Invalid OTP", 400);
    }

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