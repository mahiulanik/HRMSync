import * as leaveService from "../services/leaveService.js";
import asyncHandler from "../middlewares/asyncHandler.js";



export const createUserLeave = asyncHandler(async (req, res) => {
    const result = await leaveService.createLeave(
        req.session.userId,
        req.body
    );

    return res.status(201).json(result);
});


export const getUserLeaves = asyncHandler(async (req, res) => {
    const result = await leaveService.getLeaves(
        req.session,
        req.query
    );

    return res.status(200).json(result);
});


export const updateUserLeave = asyncHandler(async (req, res) => {
    const result = await leaveService.updateLeave(
        req.params.id,
        req.body
    );

    return res.status(200).json(result);
});


export const editUserLeave = asyncHandler(async (req, res) => {
    const result = await leaveService.editLeave(
        req.session.userId,
        req.params.id,
        req.body
    );

    return res.status(200).json(result);
});


export const deleteUserLeave = asyncHandler(async (req, res) => {
    const result = await leaveService.deleteLeave(
        req.session.userId,
        req.params.id
    );

    return res.status(200).json(result);
});