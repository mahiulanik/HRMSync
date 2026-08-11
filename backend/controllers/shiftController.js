import * as shiftService from "../services/shiftService.js";


export const createShift = async (req, res) => {
    try {
        const result = await shiftService.createShift(req.body);

        return res.status(201).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};


export const getAllShifts = async (req, res) => {
    try {
        const result = await shiftService.getAllShifts();

        return res.status(200).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};


export const getShiftById = async (req, res) => {
    try {
        const result = await shiftService.getShiftById(req.params.id);

        return res.status(200).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};


export const updateShift = async (req, res) => {
    try {
        const result = await shiftService.updateShift( req.params.id, req.body);

        return res.status(200).json(result);

    } catch (error) {

        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};


export const deactivateShift = async (req, res) => {
    try {

        const result = await shiftService.deactivateShift(req.params.id);

        return res.status(200).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};


export const activateShift = async (req, res) => {
    try {
        const result = await shiftService.activateShift(req.params.id);

        return res.status(200).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};