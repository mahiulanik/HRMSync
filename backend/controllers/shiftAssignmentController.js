import * as shiftAssignmentService from "../services/shiftAssignmentService.js";


export const getMyShifts = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: "startDate and endDate are required"
            });
        }

        const result = await shiftAssignmentService.getMyShifts(
            req.session.userId,
            startDate,
            endDate
        );
        return res.status(200).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};


export const assignShift = async (req, res) => {
    try {
        const result =
            await shiftAssignmentService.assignShift(
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


export const getEmployeeRoster = async (req, res) => {
    try {
        const {startDate,endDate} = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: "startDate and endDate are required"
            });
        }
        const result =await shiftAssignmentService.getEmployeeShiftRoster(req.params.id,startDate,endDate);
        return res.status(200).json(result);

    } catch (error) {

        return res.status(error.statusCode || 500).json({
                success: false,
                error: error.message ||"Internal Server Error"
            });
    }
};


export const getShiftByDate = async (req, res) => {
    try {
        const result = await shiftAssignmentService.getEmployeeShiftByDate(
                    req.params.id,
                    req.query.date
                );
        return res.status(200).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
                success: false,
                error: error.message || "Internal Server Error"
            });
    }
};


export const updateShiftAssignment = async (req, res) => {
    try {
        const result = await shiftAssignmentService.updateShiftAssignment(
                    req.params.id,
                    req.body.shiftId
                );
        return res.status(200).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
                success: false,
                error: error.message || "Internal Server Error"
            });
    }
};


export const deleteShiftAssignment = async (req, res) => {
    try {
        const result = await shiftAssignmentService.deleteShiftAssignment(
                    req.params.id
                );
        return res.status(200).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
                success: false,
                error: error.message || "Internal Server Error"
            });
    }
};


export const assignShiftForMonth = async (req, res) => {
    try {
        const result = await shiftAssignmentService.assignShiftForMonth(req.body);
        return res.status(201).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};