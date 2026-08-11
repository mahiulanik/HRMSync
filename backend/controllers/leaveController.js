import * as leaveService from "../services/leaveService.js";


export const createUserLeave = async (req, res) => {
    try {
        const result = await leaveService.createLeave(
            req.session.userId,
            req.body
        );

        return res.status(201).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};


export const getUserLeaves = async (req, res) => {
    try {
        const result = await leaveService.getLeaves(
            req.session,
            req.query
        );

        return res.status(200).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};


export const updateUserLeave = async (req, res) => {
    try {
        const result = await leaveService.updateLeave(
            req.params.id,
            req.body
        );

        return res.status(200).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};