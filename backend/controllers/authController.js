import * as authService from "../services/authService.js";
import asyncHandler from "../middlewares/asyncHandler.js";


export const login = asyncHandler(async (req, res) => {
    const result = await authService.loginUser(req.body);

    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "lax" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/api",
    });

    return res.status(200).json({
        accessToken: result.accessToken,
    });
});


export const session = (req, res) => {
    return res.json({
        user: req.session
    });
};


export const changePass = asyncHandler(async (req, res) => {
    const result = await authService.changePassword(
        req.session.userId,
        req.body
    );

    return res.status(200).json(result);
});


export const refreshToken = asyncHandler(async (req, res) => {
    const result = await authService.refreshToken(
        req.cookies.refreshToken
    );

    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/api",
    });

    return res.status(200).json({
        accessToken: result.accessToken,
    });
});


export const logout = asyncHandler(async (req, res) => {

    await authService.logoutUser(req.session.userId);

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api",
    });

    return res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
});


export const sendPasswordResetOTP = asyncHandler(async (req, res) => {
    const result = await authService.sendPasswordResetOTP(
        req.body.email
    );

    return res.status(200).json(result);
});


export const verifyPasswordResetOTP = asyncHandler(async (req, res) => {
    const result = await authService.verifyPasswordResetOTP(
        req.body.email,
        req.body.otp
    );

    return res.status(200).json(result);
});


export const resetEmployeePassword = asyncHandler(async (req, res) => {
    const result = await authService.resetEmployeePassword(
        req.body.email,
        req.body.otp,
        req.body.newPassword
    );

    return res.status(200).json(result);
});