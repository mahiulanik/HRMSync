import Employee from "../models/employeeModel.js"
import Leave from "../models/leaveModel.js"
import AppError from "../utils/AppError.js"


export const createLeave = async (userId, leaveData) => {

    const employee = await Employee.findOne({ userId });

    if (!employee) {
        throw new AppError("Employee not found", 404);
    }

    if (employee.isDeleted) {
        throw new AppError("Your account is deactivated, you cannot apply for leave", 403);
    }

    const {type, startDate, endDate, reason} = leaveData;

    if (!type || !startDate || !endDate || !reason) {
        throw new AppError("Missing required fields", 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
        throw new AppError("End date cannot be before start date", 400);
    }

    const leave = await Leave.create({
        employeeId: employee._id,
        type,
        startDate: start,
        endDate: end,
        reason,
        status: "PENDING"
    });

    return {
        success: true,
        data: leave
    };
};


export const getLeaves = async (session, query) => {
    const isAdmin = session.role === "ADMIN";

    if (isAdmin) {
        const where = {};

        if (query.status) {
            where.status = query.status;
        }

        if (query.month && query.year) {
            const month = parseInt(query.month);
            const year = parseInt(query.year);
            const startOfMonth = new Date(year, month - 1, 1);
            const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
            where.startDate = { $gte: startOfMonth, $lte: endOfMonth };
        }

        const leaves = await Leave.find(where)
            .populate("employeeId")
            .sort({ createdAt: -1 });

        const data = leaves.map((leave) => {
            const obj = leave.toObject();
            return {
                ...obj,
                id: obj._id.toString(),
                employee: obj.employeeId,
                employeeId: obj.employeeId?._id?.toString()
            };
        });
        return { data };
    }

    const employee = await Employee.findOne({
        userId: session.userId
    }).lean();

    if (!employee) {
        throw new AppError("Employee not found", 404);
    }

    const leaves = await Leave.find({
        employeeId: employee._id
    }).sort({ createdAt: -1 });

    return {
        data: leaves,
        employee: {
            ...employee,
            id: employee._id.toString()
        }
    };
};


export const updateLeave = async (id, leaveData) => {
    const { status } = leaveData;

    if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
        throw new AppError("Invalid status", 400);
    }
    const leave = await Leave.findByIdAndUpdate(
        id,
        { status },
        { returnDocument: "after" }
    );
    if (!leave) {
        throw new AppError("Leave not found", 404);
    }
    return {
        success: true,
        data: leave
    };
};