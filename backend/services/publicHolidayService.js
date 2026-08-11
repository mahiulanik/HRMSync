import PublicHoliday from "../models/publicHolidayModel.js";
import AppError from "../utils/AppError.js";


export const createPublicHoliday = async (data) => {
    const { name, startDate, endDate } = data;

    if (!name || !startDate || !endDate) {
        throw new AppError("Name, start date and end date are required", 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
        throw new AppError("End date cannot be before start date", 400);
    }

    const holiday = await PublicHoliday.create({
        name: name.trim(),
        startDate: start,
        endDate: end
    });

    return { success: true, data: holiday };
};


export const getAllPublicHolidays = async () => {
    const holidays = await PublicHoliday.find().sort({ startDate: -1 }).lean();
    return { success: true, data: holidays };
};


export const getPublicHolidayById = async (id) => {
    const holiday = await PublicHoliday.findById(id).lean();
    if (!holiday) {
        throw new AppError("Public holiday not found", 404);
    }
    return { success: true, data: holiday };
};


export const updatePublicHoliday = async (id, data) => {
    const { name, startDate, endDate } = data;

    const holiday = await PublicHoliday.findById(id);
    if (!holiday) {
        throw new AppError("Public holiday not found", 404);
    }

    if (name !== undefined) holiday.name = name.trim();
    if (startDate !== undefined) holiday.startDate = new Date(startDate);
    if (endDate !== undefined) holiday.endDate = new Date(endDate);

    if (holiday.endDate < holiday.startDate) {
        throw new AppError("End date cannot be before start date", 400);
    }

    await holiday.save();
    return { success: true, data: holiday };
};


export const deletePublicHoliday = async (id) => {
    const holiday = await PublicHoliday.findById(id);
    if (!holiday) {
        throw new AppError("Public holiday not found", 404);
    }

    await PublicHoliday.findByIdAndDelete(id);
    return { success: true, message: "Public holiday deleted successfully" };
};
