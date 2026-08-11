import Shift from "../models/shiftModel.js";
import AppError from "../utils/AppError.js";


export const createShift = async (shiftData) => {

    const {name,startTime, endTime, graceMinutes, weekends} = shiftData;

    if (!name || !startTime || !endTime) {
        throw new AppError("Name, start time and end time are required", 400);
    }

    const existingShift = await Shift.findOne({
        name: name.trim()
    });

    if (existingShift) {
        if (!existingShift.isActive) {
            throw new AppError("Shift already exists but is inactive. Please activate it.", 409);
        }
        throw new AppError("Shift with this name already exists", 409);
    }


    const shift = await Shift.create({
        name: name.trim(),
        startTime,
        endTime,
        graceMinutes,
        weekends: weekends || []
    });

    return {
        success: true,
        data: shift
    };
};


export const getAllShifts = async () => {
    const shifts = await Shift.find().sort({ createdAt: -1 }).lean();

    return {
        success: true,
        data: shifts
    };
};


export const getShiftById = async (id) => {
    const shift = await Shift.findById(id).lean();

    if (!shift) {
        throw new AppError( "Shift not found", 404);
    }

    return {
        success: true,
        data: shift
    };
};


export const updateShift = async (id, shiftData) => {
    const { name, startTime, endTime, graceMinutes, weekends} = shiftData;

    const shift = await Shift.findById(id);

    if (!shift) {
        throw new AppError("Shift not found", 404);
    }

    if (name && name.trim() !== shift.name) {
        const existingShift = await Shift.findOne({
            name: name.trim(),
            _id: { $ne: id }
        });

        if (existingShift) {
            throw new AppError("Shift with this name already exists", 409);
        }

        shift.name = name.trim();
    }


    if (startTime !== undefined) {
        shift.startTime = startTime;
    }

    if (endTime !== undefined) {
        shift.endTime = endTime;
    }

    if (graceMinutes !== undefined) {
        shift.graceMinutes = graceMinutes;
    }

    if (weekends !== undefined) {
        shift.weekends = weekends;
    }

    await shift.save();

    return {
        success: true,
        data: shift
    };
};


export const deactivateShift = async (id) => {
    const shift = await Shift.findById(id);

    if (!shift) {
        throw new AppError("Shift not found", 404);
    }

    if (!shift.isActive) {
        throw new AppError("Shift is already inactive", 400);
    }

    shift.isActive = false;

    await shift.save();

    return {
        success: true,
        message: "Shift deactivated successfully",
        data: shift
    };
};


export const activateShift = async (id) => {
    const shift = await Shift.findById(id);
    
    if (!shift) {
        throw new AppError("Shift not found", 404);
    }

    if (shift.isActive) {
        throw new AppError("Shift is already active", 400);
    }

    shift.isActive = true;

    await shift.save();

    return {
        success: true,
        message: "Shift activated successfully",
        data: shift
    };
};