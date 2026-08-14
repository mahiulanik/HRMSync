import * as authService from "../services/authService.js";


export const login = async (req, res) => {
    try {
        const result = await authService.loginUser(req.body);

        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/api",
        });

        return res.status(200).json({
            accessToken: result.accessToken,
        });

    } catch (error) {
        return res.status(401).json({
            error: error.message || "Login failed",
        });
    }
};


export const session = (req, res) => {
    const session = req.session
    return res.json({user: session})
}


export const changePass = async (req, res) => {

    try {
        const result = await authService.changePassword(
            req.session.userId,
            req.body
        );

        return res.status(200).json(result);

    } catch (error) {
        return res.status(500).json({
            error: error.message || "Failed to change password",
        });
    }
};


export const refreshToken = async (req, res) => {
    try {
        const result = await authService.refreshToken(
            req.cookies.refreshToken
        );

        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/api",
        });

        return res.status(200).json({
            accessToken: result.accessToken,
        });

    } catch (error) {
        return res.status(401).json({
            error: error.message || "Invalid refresh token",
        });
    }
};


export const logout = (req, res) => {
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/api",
    });

    return res.status(200).json({
        message: "Logged out successfully",
    });
};


export const sendPasswordResetOTP = async (req, res) => {

    try {

        const result =
            await authService.sendPasswordResetOTP(
                req.body.email
            );

        return res.status(200).json(result);

    } catch (error) {

        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};



export const verifyPasswordResetOTP = async (req, res) => {

    try {

        const result =
            await authService.verifyPasswordResetOTP(
                req.body.email,
                req.body.otp
            );

        return res.status(200).json(result);

    } catch (error) {

        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};



export const resetEmployeePassword = async (req, res) => {

    try {

        const result =
            await authService.resetEmployeePassword(
                req.body.email,
                req.body.otp,
                req.body.newPassword
            );

        return res.status(200).json(result);

    } catch (error) {

        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};


