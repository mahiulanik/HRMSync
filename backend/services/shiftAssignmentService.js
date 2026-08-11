import ShiftAssignment from "../models/shiftAssignmentModel.js";
import Employee from "../models/employeeModel.js";
import Shift from "../models/shiftModel.js";
import AppError from "../utils/AppError.js";


export const getMyShifts = async (userId, startDate, endDate) => {
    const employee = await Employee.findOne({ userId }).lean();

    if (!employee) {
        throw new AppError("Employee profile not found", 404);
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const assignments = await ShiftAssignment.find({
        employeeId: employee._id,
        date: {
            $gte: start,
            $lte: end
        }
    })
        .populate("shiftId")
        .sort({ date: 1 })
        .lean();

    const data = assignments.map((assignment) => ({
        ...assignment,
        id: assignment._id.toString(),
        employeeId: assignment.employeeId.toString(),
        shift: assignment.shiftId,
        shiftId: assignment.shiftId?._id?.toString()
    }));

    return {
        success: true,
        data
    };
};


export const assignShift = async (assignmentData) => {

    const {employeeId,shiftId,date} = assignmentData;

    if (!employeeId || !shiftId || !date) {
        throw new AppError("Employee, shift and date are required", 400);
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
        throw new AppError("Employee not found", 404);
    }

    if (employee.isDeleted) {
        throw new AppError("Cannot assign shift to a deactivated employee", 403);
    }

    const shift = await Shift.findById(shiftId);

    if (!shift) {
        throw new AppError("Shift not found", 404);
    }

    if (!shift.isActive) {
        throw new AppError("Cannot assign an inactive shift", 400);
    }

    const assignmentDate = new Date(date);
    assignmentDate.setHours(0, 0, 0, 0);

    const existingAssignment = await ShiftAssignment.findOne({
            employeeId,
            date: assignmentDate
        });

    if (existingAssignment) {
        existingAssignment.shiftId = shiftId;
        await existingAssignment.save();
        return {
            success: true,
            data: existingAssignment,
            message: "Shift updated for this date"
        };
    }

    const assignment = await ShiftAssignment.create({
        employeeId,
        shiftId,
        date: assignmentDate
    });

    return {
        success: true,
        data: assignment
    };
};


export const getEmployeeShiftRoster = async (employeeId,startDate,endDate) => {

    const employee = await Employee.findById(employeeId).lean();

    if (!employee) {
        throw new AppError("Employee not found", 404);
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const assignments = await ShiftAssignment.find({
        employeeId,
        date: {
            $gte: start,
            $lte: end
        }
    })
        .populate("shiftId")
        .sort({ date: 1 })
        .lean();

    const data = assignments.map((assignment) => ({
        ...assignment,
        id: assignment._id.toString(),
        employeeId: assignment.employeeId.toString(),
        shift: assignment.shiftId,
        shiftId: assignment.shiftId?._id?.toString()
    }));

    return {
        success: true,
        data
    };
};



export const getEmployeeShiftByDate = async (employeeId,date) => {

    const assignmentDate = new Date(date);
    assignmentDate.setHours(0, 0, 0, 0);

    const assignment = await ShiftAssignment.findOne({
            employeeId,
            date: assignmentDate
        })
        .populate("shiftId")
        .lean();

    if (!assignment) {
        throw new AppError("No shift assigned for this date", 404);
    }

    return {
        success: true,
        data: {
            ...assignment,
            id: assignment._id.toString(),
            shift: assignment.shiftId,
            shiftId: assignment.shiftId?._id?.toString()
        }
    };
};


export const updateShiftAssignment = async (id,shiftId) => {

    if (!shiftId) {
        throw new AppError("Shift ID is required", 400);
    }

    const shift = await Shift.findById(shiftId);

    if (!shift) {
        throw new AppError("Shift not found", 404);
    }

    if (!shift.isActive) {
        throw new AppError("Cannot assign an inactive shift", 400);
    }

    const assignment = await ShiftAssignment.findById(id);

    if (!assignment) {
        throw new AppError("Shift assignment not found", 404);
    }

    assignment.shiftId = shiftId;
    await assignment.save();

    const updatedAssignment = await ShiftAssignment.findById(assignment._id).populate("shiftId").lean();

    return {
        success: true,
        data: updatedAssignment
    };
};


export const deleteShiftAssignment = async (id) => {

    const assignment = await ShiftAssignment.findById(id);

    if (!assignment) {
        throw new AppError("Shift assignment not found", 404);
    }

    await ShiftAssignment.findByIdAndDelete(id);

    return {
        success: true,
        message: "Shift assignment removed successfully"
    };
};


export const assignShiftForMonth = async (assignmentData) => {

    const {employeeId, shiftId, month, year} = assignmentData;

    if (!employeeId || !shiftId || !month || !year) {
        throw new AppError("Employee, shift, month and year are required", 400);
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
        throw new AppError("Employee not found", 404);
    }
    if (employee.isDeleted) {
        throw new AppError("Cannot assign shift to a deactivated employee", 403);
    }

    const shift = await Shift.findById(shiftId);
    if (!shift) {
        throw new AppError("Shift not found", 404);
    }
    if (!shift.isActive) {
        throw new AppError("Cannot assign an inactive shift", 400);
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const daysInMonth = endDate.getDate();
    const assigned = [];
    const updated = [];
    const skipped = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        date.setHours(0, 0, 0, 0);

        const existing = await ShiftAssignment.findOne({ employeeId, date });
        if (existing) {
            if (existing.shiftId.toString() !== shiftId) {
                existing.shiftId = shiftId;
                await existing.save();
                updated.push(day);
            }
            continue;
        }

        const assignment = await ShiftAssignment.create({ employeeId, shiftId, date });
        assigned.push(day);
    }

    return {
        success: true,
        message: `Assigned ${assigned.length} days, updated ${updated.length} days, skipped ${skipped.length} days`,
        assigned,
        updated,
        skipped
    };
};

