import * as attendanceService from "../services/attendanceService.js";
import asyncHandler from "../middlewares/asyncHandler.js";


export const userClockInOut = asyncHandler(async (req, res) => {
    const result = await attendanceService.clockInOut(
        req.session
    );

    return res.status(200).json(result);
});


export const getAdminAttendance = asyncHandler(async (req, res) => {
    const result = await attendanceService.getAdminAttendance(
        req.query
    );

    return res.status(200).json(result);
});


export const getUserAttendance = asyncHandler(async (req, res) => {
    const result = await attendanceService.getAttendance(
        req.session,
        req.query
    );

    return res.status(200).json(result);
});