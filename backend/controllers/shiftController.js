import * as shiftService from "../services/shiftService.js";
import asyncHandler from "../middlewares/asyncHandler.js";


export const createShift = asyncHandler(async (req, res) => {
    const result = await shiftService.createShift(req.body);

    return res.status(201).json(result);
});


export const getAllShifts = asyncHandler(async (req, res) => {
    const result = await shiftService.getAllShifts();

    return res.status(200).json(result);
});


export const getShiftById = asyncHandler(async (req, res) => {
    const result = await shiftService.getShiftById(
        req.params.id
    );

    return res.status(200).json(result);
});


export const updateShift = asyncHandler(async (req, res) => {
    const result = await shiftService.updateShift(
        req.params.id,
        req.body
    );

    return res.status(200).json(result);
});


export const deactivateShift = asyncHandler(async (req, res) => {
    const result = await shiftService.deactivateShift(
        req.params.id
    );

    return res.status(200).json(result);
});


export const activateShift = asyncHandler(async (req, res) => {
    const result = await shiftService.activateShift(
        req.params.id
    );

    return res.status(200).json(result);
});