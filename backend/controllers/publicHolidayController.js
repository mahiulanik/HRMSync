import * as publicHolidayService from "../services/publicHolidayService.js";
import asyncHandler from "../middlewares/asyncHandler.js";


export const createPublicHoliday = asyncHandler(async (req, res) => {
    const result = await publicHolidayService.createPublicHoliday(req.body);

    return res.status(201).json(result);
});


export const getAllPublicHolidays = asyncHandler(async (req, res) => {
    const result = await publicHolidayService.getAllPublicHolidays();

    return res.status(200).json(result);
});


export const getPublicHolidayById = asyncHandler(async (req, res) => {
    const result = await publicHolidayService.getPublicHolidayById(
        req.params.id
    );

    return res.status(200).json(result);
});


export const updatePublicHoliday = asyncHandler(async (req, res) => {
    const result = await publicHolidayService.updatePublicHoliday(
        req.params.id,
        req.body
    );

    return res.status(200).json(result);
});


export const deletePublicHoliday = asyncHandler(async (req, res) => {
    const result = await publicHolidayService.deletePublicHoliday(
        req.params.id
    );

    return res.status(200).json(result);
});