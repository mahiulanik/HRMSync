import * as shiftAssignmentService from "../services/shiftAssignmentService.js";
import asyncHandler from "../middlewares/asyncHandler.js";


export const getMyShifts = asyncHandler(async (req, res) => {
    const result = await shiftAssignmentService.getMyShifts(
        req.session.userId,
        req.query.startDate,
        req.query.endDate
    );

    return res.status(200).json(result);
});


export const assignShift = asyncHandler(async (req, res) => {
    const result = await shiftAssignmentService.assignShift(
        req.body
    );

    return res.status(201).json(result);
});


export const getEmployeeRoster = asyncHandler(async (req, res) => {
    const result = await shiftAssignmentService.getEmployeeShiftRoster(
        req.params.id,
        req.query.startDate,
        req.query.endDate
    );

    return res.status(200).json(result);
});


export const getShiftByDate = asyncHandler(async (req, res) => {
    const result = await shiftAssignmentService.getEmployeeShiftByDate(
        req.params.id,
        req.query.date
    );

    return res.status(200).json(result);
});


export const updateShiftAssignment = asyncHandler(async (req, res) => {
    const result = await shiftAssignmentService.updateShiftAssignment(
        req.params.id,
        req.body.shiftId
    );

    return res.status(200).json(result);
});


export const deleteShiftAssignment = asyncHandler(async (req, res) => {
    const result = await shiftAssignmentService.deleteShiftAssignment(
        req.params.id
    );

    return res.status(200).json(result);
});


export const assignShiftForMonth = asyncHandler(async (req, res) => {
    const result = await shiftAssignmentService.assignShiftForMonth(
        req.body
    );

    return res.status(201).json(result);
});