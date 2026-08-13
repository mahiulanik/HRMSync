import * as profileService from "../services/profileService.js";


export const getUserProfile = async (req, res) => {
    try {
        const result = await profileService.getProfile(
            req.params.userId
        );

        return res.status(200).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Failed to fetch profile",
        });
    }
};


export const updateUserProfile = async (req, res) => {
    try {
        const result = await profileService.updateProfile(
            req.session.userId,
            req.body
        );

        return res.status(200).json(result);

    } catch (error) {
        return res.status(500).json({
            error: error.message || "Failed to update profile",
        });
    }
};


export const uploadProfilePic = async (req, res) => {
    try {
        const result = await profileService.uploadProfilePic(
            req.session.userId,
            req.file
        );

        return res.status(200).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            error: error.message || "Failed to upload profile picture",
        });
    }
};