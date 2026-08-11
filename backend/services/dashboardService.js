import { DEPARTMENTS } from "../constants/departments.js"
import Attendance from "../models/attendanceModel.js"
import Employee from "../models/employeeModel.js"
import Leave from "../models/leaveModel.js"
import Payslip from "../models/payslipModel.js"



export const getDashboard = async (session) => {
    if (session.role === "ADMIN") {
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(24, 0, 0, 0);

    const [totalEmployees, todayAttendance, pendingLeaves, recentEmployees] = await Promise.all([
        Employee.countDocuments({
            isDeleted: { $ne: true }
        }),
        Attendance.countDocuments({
            date: {
                $gte: startOfToday,
                $lt: endOfToday
            }
        }),
        Leave.countDocuments({
            status: "PENDING"
        }),
        Employee.find({ isDeleted: { $ne: true } })
            .select('firstName lastName department position profilePic')
            .sort({ createdAt: -1 })
            .limit(8)
            .lean()
    ]);
    
    return {
        role: "ADMIN",
        totalEmployees,
        totalDepartments: DEPARTMENTS.length,
        todayAttendance,
        pendingLeaves,
        recentEmployees
    };
}

const employee = await Employee.findOne({
        userId: session.userId
    }).lean();

    if (!employee) {
        throw new AppError("Employee not found", 404);
    }

    const today = new Date();
    const startOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
    );

    const endOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        1
    );

    const [currentMonthAttendance, pendingLeaves, latestPayslip] = await Promise.all([
        Attendance.countDocuments({
            employeeId: employee._id,
            date: {
                $gte: startOfMonth,
                $lt: endOfMonth
            }
        }),
        Leave.countDocuments({
            employeeId: employee._id,
            status: "PENDING"
        }),
        Payslip.findOne({
            employeeId: employee._id
        }).sort({ createdAt: -1 }).lean()
    ]);

    return {
        role: "EMPLOYEE",
        employee: {
            ...employee,
            id: employee._id.toString()
        },
        currentMonthAttendance,
        pendingLeaves,
        latestPayslip: latestPayslip ? {...latestPayslip, id: latestPayslip._id.toString()} : null
    };
};