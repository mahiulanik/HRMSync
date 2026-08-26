import * as profileService from "../services/profileService.js";
import asyncHandler from "../middlewares/asyncHandler.js";


export const getUserProfile = asyncHandler(async (req, res) => {
    const result = await profileService.getProfile(req.session);

    return res.status(200).json(result);
});

export const updateUserProfile = asyncHandler(async (req, res) => {
    const result = await profileService.updateProfile(
        req.session.userId,
        req.body
    );

    return res.status(200).json(result);
});

export const uploadProfilePic = asyncHandler(async (req, res) => {
    const result = await profileService.uploadProfilePic(
        req.session.userId,
        req.file
    );

    return res.status(200).json(result);
});