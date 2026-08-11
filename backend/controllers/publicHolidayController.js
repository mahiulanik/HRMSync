import * as publicHolidayService from "../services/publicHolidayService.js";


export const createPublicHoliday = async (req, res) => {
    try {
        const result = await publicHolidayService.createPublicHoliday(req.body);
        return res.status(201).json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};


export const getAllPublicHolidays = async (req, res) => {
    try {
        const result = await publicHolidayService.getAllPublicHolidays();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};


export const getPublicHolidayById = async (req, res) => {
    try {
        const result = await publicHolidayService.getPublicHolidayById(req.params.id);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};


export const updatePublicHoliday = async (req, res) => {
    try {
        const result = await publicHolidayService.updatePublicHoliday(req.params.id, req.body);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};


export const deletePublicHoliday = async (req, res) => {
    try {
        const result = await publicHolidayService.deletePublicHoliday(req.params.id);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};
