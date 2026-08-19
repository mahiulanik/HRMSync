import AppError from "../utils/AppError.js";

export const testSuccess = async (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Success route is working"
    });
};

export const testError = async (req, res) => {
    throw new AppError("This is a test error", 400);
};

export const testServerError = async (req, res) => {
    throw new Error("Something unexpected happened");
};
