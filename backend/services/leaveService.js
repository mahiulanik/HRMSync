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

    const start = new Date(startDate);
    const end = new Date(endDate);

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

        const pageNum = Math.max(1, parseInt(query.page) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(query.limit) || 20));
        const skip = (pageNum - 1) * limitNum;

        const [leaves, totalCount] = await Promise.all([
            Leave.find(where)
                .populate("employeeId", "firstName lastName email department position")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Leave.countDocuments(where)
        ]);

        const data = leaves.map((leave) => {
            const obj = leave.toObject();
            return {
                ...obj,
                id: obj._id.toString(),
                employee: obj.employeeId,
                employeeId: obj.employeeId?._id?.toString()
            };
        });
        return {
            data,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalCount / limitNum),
                totalCount,
                limit: limitNum
            }
        };
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


export const editLeave = async (userId, id, leaveData) => {
    const employee = await Employee.findOne({ userId });

    if (!employee) {
        throw new AppError("Employee not found", 404);
    }

    const leave = await Leave.findById(id);

    if (!leave) {
        throw new AppError("Leave not found", 404);
    }

    if (leave.employeeId.toString() !== employee._id.toString()) {
        throw new AppError("You can only edit your own leave requests", 403);
    }

    if (leave.status !== "PENDING") {
        throw new AppError("You can only edit pending leave requests", 400);
    }

    const { type, startDate, endDate, reason } = leaveData;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const updated = await Leave.findByIdAndUpdate(
        id,
        { type, startDate: start, endDate: end, reason },
        { returnDocument: "after" }
    );

    return {
        success: true,
        data: updated
    };
};


export const deleteLeave = async (userId, id) => {
    const employee = await Employee.findOne({ userId });

    if (!employee) {
        throw new AppError("Employee not found", 404);
    }

    const leave = await Leave.findById(id);

    if (!leave) {
        throw new AppError("Leave not found", 404);
    }

    if (leave.employeeId.toString() !== employee._id.toString()) {
        throw new AppError("You can only delete your own leave requests", 403);
    }

    await Leave.findByIdAndDelete(id);

    return {
        success: true,
        message: "Leave deleted successfully"
    };
};