import * as attendanceService from "../services/attendanceService.js";

export const userClockInOut = async (req, res) => {
    try {
        const result = await attendanceService.clockInOut(req.session);

        return res.status(200).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            error: error.message || "Operation failed",
        });
    }
};


export const getAdminAttendance = async (req, res) => {
    try {
        const result = await attendanceService.getAdminAttendance(req.query);

        return res.status(200).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            error: error.message || "Failed to fetch attendance",
        });
    }
};

export const getUserAttendance = async (req, res) => {
    try {
        const result = await attendanceService.getAttendance(
            req.session,
            req.query
        );

        return res.status(200).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            error: error.message || "Failed to fetch attendance",
        });
    }
};