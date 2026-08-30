import { DEPARTMENTS } from "../constants/departments.js";
import Attendance from "../models/attendanceModel.js";
import Employee from "../models/employeeModel.js";
import Leave from "../models/leaveModel.js";
import Payslip from "../models/payslipModel.js";
import Payroll from "../models/payrollModel.js";
import PublicHoliday from "../models/publicHolidayModel.js";
import ShiftAssignment from "../models/shiftAssignmentModel.js";
import AppError from "../utils/AppError.js";
import {
    nowInDhaka, toDateKey, isWeekendByDateStr,
    startOfDayDhaka, endOfDayDhaka,
    startOfMonthDhaka, endOfMonthDhaka,
    startOfYearDhaka, endOfYearDhaka, WEEKEND_DAYS
} from "../utils/dateHelpers.js";

// ─── Constants ───────────────────────────────────────────────
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ─── Reusable DB Queries ─────────────────────────────────────

/** Count all employees (optionally filtered) */
const countEmployees = (extraFilter = {}) =>
    Employee.countDocuments({ isDeleted: { $ne: true }, ...extraFilter });

/** Get employee hiring growth over N months */
const getEmployeeGrowth = async (months = 6) => {
    const startOfRange = startOfMonthDhaka(months - 1);
    const now = nowInDhaka();

    const raw = await Employee.aggregate([
        {
            $match: {
                isDeleted: { $ne: true },
                createdAt: { $gte: startOfRange }
            }
        },
        {
            $group: {
                _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const growth = [];
    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const found = raw.find(g => g._id.year === year && g._id.month === month);
        growth.push({ month: MONTH_NAMES[month - 1], employees: found ? found.count : 0 });
    }
    return growth;
};

/** Build attendance series for a date range with inferred absence */
const getAttendanceSeries = async (startDate, endDate, employeesForAbsence, holidaysInRange) => {
    const holidaySet = new Set();
    for (const h of holidaysInRange) {
        const s = new Date(h.startDate);
        const e = new Date(h.endDate);
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
            holidaySet.add(toDateKey(d));
        }
    }

    const leaveCountsByDate = {};
    const leavesInRange = await Leave.find({
        status: "APPROVED",
        startDate: { $lte: endDate },
        endDate: { $gte: startDate }
    }).select("employeeId startDate endDate").lean();

    for (const l of leavesInRange) {
        const s = new Date(Math.max(new Date(l.startDate).getTime(), startDate.getTime()));
        const e = new Date(Math.min(new Date(l.endDate).getTime(), endDate.getTime()));
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
            const key = toDateKey(d);
            if (!leaveCountsByDate[key]) leaveCountsByDate[key] = new Set();
            leaveCountsByDate[key].add(String(l.employeeId));
        }
    }

    const countExpected = (dateStr) => {
        const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);
        return employeesForAbsence.filter(e => new Date(e.createdAt) <= dayEnd).length;
    };

    const raw = await Attendance.aggregate([
        { $match: { date: { $gte: startDate, $lt: endDate } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                present: { $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] } },
                late: { $sum: { $cond: [{ $eq: ["$status", "LATE"] }, 1, 0] } },
                absent: { $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] } }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    return raw.map(d => {
        const dateStr = d._id;
        if (isWeekendByDateStr(dateStr) || holidaySet.has(dateStr)) {
            return { ...d, absent: 0 };
        }
        const expected = countExpected(dateStr);
        const onLeave = leaveCountsByDate[dateStr] ? leaveCountsByDate[dateStr].size : 0;
        const absent = Math.max(expected - d.present - d.late - onLeave, 0);
        return { ...d, absent };
    });
};

/** Get department attendance overview */
const getDepartmentOverview = async (todayStart, todayEnd) => {
    const deptAttendance = await Attendance.aggregate([
        { $match: { date: { $gte: todayStart, $lt: todayEnd } } },
        {
            $lookup: {
                from: "employees",
                localField: "employeeId",
                foreignField: "_id",
                as: "employee"
            }
        },
        { $unwind: "$employee" },
        { $match: { "employee.isDeleted": { $ne: true } } },
        {
            $group: {
                _id: { department: "$employee.department", status: "$status" },
                count: { $sum: 1 }
            }
        }
    ]);

    const empCountsRaw = await Employee.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: "$department", total: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]);

    const empCounts = {};
    for (const d of empCountsRaw) empCounts[d._id] = d.total;

    const deptMap = {};
    for (const d of deptAttendance) {
        const dept = d._id.department;
        if (!deptMap[dept]) deptMap[dept] = { present: 0, late: 0, absent: 0, total: 0 };
        if (d._id.status === "PRESENT") deptMap[dept].present = d.count;
        if (d._id.status === "LATE") deptMap[dept].late = d.count;
        if (d._id.status === "ABSENT") deptMap[dept].absent = d.count;
        deptMap[dept].total += d.count;
    }

    return DEPARTMENTS.filter(dept => empCounts[dept]).map(dept => {
        const attendance = deptMap[dept] || { present: 0, late: 0, absent: 0, total: 0 };
        const deptEmployeeCount = empCounts[dept] || 1;
        const totalPresentLate = attendance.present + attendance.late;
        const rate = deptEmployeeCount > 0 ? Math.round((totalPresentLate / deptEmployeeCount) * 100) : 0;

        return {
            department: dept,
            totalEmployees: deptEmployeeCount,
            attendanceRate: Math.min(rate, 100),
            present: attendance.present,
            late: attendance.late,
            absent: attendance.absent
        };
    });
};

/** Infer today's absent count */
const inferTodayAbsent = (todayPresent, todayLate, onLeaveCount, employeesForAbsence, holidaysInRange) => {
    const today = nowInDhaka();
    const todayDateStr = toDateKey(today);

    if (isWeekendByDateStr(todayDateStr)) return 0;

    // Check if today falls on any holiday
    for (const h of holidaysInRange) {
        const s = new Date(h.startDate);
        const e = new Date(h.endDate);
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
            if (toDateKey(d) === todayDateStr) return 0;
        }
    }

    const dayEnd = new Date(`${todayDateStr}T23:59:59.999Z`);
    const expected = employeesForAbsence.filter(e => new Date(e.createdAt) <= dayEnd).length;
    return Math.max(expected - todayPresent - todayLate - onLeaveCount, 0);
};

// ─── Admin Dashboard ─────────────────────────────────────────

export const getAdminDashboard = async () => {
    const now = nowInDhaka();
    const todayStart = startOfDayDhaka(0);
    const todayEnd = endOfDayDhaka();
    const startOf7DaysAgo = startOfDayDhaka(6);
    const startOf30DaysAgo = startOfDayDhaka(29);

    // Batch 1: independent queries
    const [
        totalEmployees,
        activeEmployees,
        todayAttendanceRecords,
        pendingLeaves,
        recentEmployees,
        payrollThisMonth,
        overtimeResult,
        onLeaveToday,
        departmentAttendance,
        leaveRequests,
        employeeGrowth,
        upcomingHolidays,
        employeesForAbsence,
        holidaysInRange
    ] = await Promise.all([
        countEmployees(),
        countEmployees({ employeeStatus: "Active" }),
        Attendance.find({ date: { $gte: todayStart, $lt: todayEnd } }).lean(),
        Leave.countDocuments({ status: "PENDING" }),
        Employee.find({ isDeleted: { $ne: true } })
            .select("firstName lastName department position profilePic")
            .sort({ createdAt: -1 })
            .limit(8)
            .lean(),
        Payroll.findOne({ month: now.getMonth() + 1, year: now.getFullYear() }).lean(),
        Attendance.aggregate([
            {
                $match: { date: { $gte: todayStart, $lt: todayEnd }, overtimeMinutes: { $gt: 0 } }
            },
            {
                $group: {
                    _id: null,
                    totalOvertimeMinutes: { $sum: "$overtimeMinutes" },
                    employeeCount: { $sum: 1 }
                }
            }
        ]),
        Leave.aggregate([
            { $match: { status: "APPROVED", startDate: { $lte: todayEnd }, endDate: { $gte: todayStart } } },
            { $count: "count" }
        ]),
        getDepartmentOverview(todayStart, todayEnd),
        Leave.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        getEmployeeGrowth(6),
        PublicHoliday.find({ startDate: { $gte: now } }).sort({ startDate: 1 }).limit(5).lean(),
        Employee.find({ isDeleted: { $ne: true } }).select("createdAt").limit(500).lean(),
        PublicHoliday.find({
            startDate: { $lte: todayEnd },
            endDate: { $gte: startOf30DaysAgo }
        }).select("startDate endDate").lean()
    ]);

    // Batch 2: attendance series (depends on employeesForAbsence + holidaysInRange)
    const [attendanceLast7Days, attendanceLast30Days] = await Promise.all([
        getAttendanceSeries(startOf7DaysAgo, todayEnd, employeesForAbsence, holidaysInRange),
        getAttendanceSeries(startOf30DaysAgo, todayEnd, employeesForAbsence, holidaysInRange)
    ]);

    // Compute today's stats
    const todayPresent = todayAttendanceRecords.filter(r => r.status === "PRESENT").length;
    const todayLate = todayAttendanceRecords.filter(r => r.status === "LATE").length;
    const attendanceRate = activeEmployees > 0
        ? Math.round(((todayPresent + todayLate) / activeEmployees) * 100)
        : 0;
    const overtimeHours = overtimeResult.length > 0
        ? Math.round(overtimeResult[0].totalOvertimeMinutes / 60 * 10) / 10
        : 0;
    const onLeaveCount = onLeaveToday.length > 0 ? onLeaveToday[0].count : 0;

    const todayAbsent = inferTodayAbsent(todayPresent, todayLate, onLeaveCount, employeesForAbsence, holidaysInRange);

    const leaveMap = {};
    for (const l of leaveRequests) leaveMap[l._id] = l.count;

    return {
        role: "ADMIN",
        totalEmployees,
        activeEmployees,
        inactiveEmployees: totalEmployees - activeEmployees,
        todayPresent,
        todayLate,
        todayAbsent,
        pendingLeaves,
        attendanceRate,
        payrollThisMonth: payrollThisMonth ? {
            grossSalary: payrollThisMonth.totalGrossSalary,
            deductions: payrollThisMonth.totalDeductions,
            netSalary: payrollThisMonth.totalNetSalary,
            status: payrollThisMonth.status
        } : null,
        overtimeHours,
        onLeaveToday: onLeaveCount,
        attendanceLast7Days,
        attendanceLast30Days,
        departmentOverview: departmentAttendance,
        leaveRequests: {
            pending: leaveMap["PENDING"] || 0,
            approved: leaveMap["APPROVED"] || 0,
            rejected: leaveMap["REJECTED"] || 0
        },
        employeeGrowth,
        recentEmployees,
        upcomingHolidays: upcomingHolidays.map(h => ({
            name: h.name,
            startDate: h.startDate,
            endDate: h.endDate
        }))
    };
};

// ─── Employee Dashboard ──────────────────────────────────────

export const getEmployeeDashboard = async (session) => {
    const employee = await Employee.findOne({ userId: session.userId }).lean();

    if (!employee) {
        throw new AppError("Employee not found", 404);
    }

    const now = nowInDhaka();
    const todayStart = startOfDayDhaka(0);
    const todayEnd = endOfDayDhaka();
    const monthStart = startOfMonthDhaka(0);
    const monthEnd = endOfMonthDhaka();
    const yearStart = startOfYearDhaka();
    const yearEnd = endOfYearDhaka();

    const isTodayWeekend = WEEKEND_DAYS.includes(now.getDay());

    const [
        todayAttendance,
        monthAttendanceRecords,
        pendingLeaves,
        latestPayslip,
        salaryHistory,
        todayShiftAssignment,
        leaveByType,
        monthLeaves,
        nextHoliday
    ] = await Promise.all([
        Attendance.findOne({
            employeeId: employee._id,
            date: { $gte: todayStart, $lt: todayEnd }
        }).lean(),

        Attendance.find({
            employeeId: employee._id,
            date: { $gte: monthStart, $lte: monthEnd }
        }).select("status date checkIn checkOut").lean(),

        Leave.countDocuments({
            employeeId: employee._id,
            status: "PENDING"
        }),

        Payslip.findOne({ employeeId: employee._id })
            .sort({ createdAt: -1 })
            .lean(),

        Payslip.find({ employeeId: employee._id })
            .sort({ year: -1, month: -1 })
            .limit(3)
            .select("month year netSalary grossSalary")
            .lean(),

        ShiftAssignment.findOne({
            employeeId: employee._id,
            date: { $gte: todayStart, $lt: todayEnd }
        }).populate("shiftId", "name startTime endTime weekends").lean(),

        Leave.aggregate([
            {
                $match: {
                    employeeId: employee._id,
                    startDate: { $gte: yearStart, $lte: yearEnd },
                    status: { $in: ["APPROVED", "PENDING"] }
                }
            },
            { $group: { _id: "$type", count: { $sum: 1 } } }
        ]),

        Leave.find({
            employeeId: employee._id,
            status: "APPROVED",
            startDate: { $lte: monthEnd },
            endDate: { $gte: monthStart }
        }).select("startDate endDate type").lean(),

        PublicHoliday.find({ endDate: { $gte: todayStart } })
            .sort({ startDate: 1 })
            .limit(5)
            .lean()
    ]);

    // Attendance map for calendar
    const attendanceMap = new Map();
    for (const record of monthAttendanceRecords) {
        const dateKey = toDateKey(record.date);
        attendanceMap.set(dateKey, {
            status: String(record.status || "").toUpperCase(),
            date: record.date,
            checkIn: record.checkIn || null,
            checkOut: record.checkOut || null
        });
    }

    // Public holidays this month
    const holidaysThisMonth = await PublicHoliday.find({
        startDate: { $lte: monthEnd },
        endDate: { $gte: monthStart }
    }).select("name startDate endDate").lean();

    const holidaySetMonth = new Set();
    const holidayInfoMap = new Map();
    for (const holiday of holidaysThisMonth) {
        const holidayStart = new Date(holiday.startDate);
        const holidayEnd = new Date(holiday.endDate);
        for (let d = new Date(holidayStart); d <= holidayEnd; d.setDate(d.getDate() + 1)) {
            const dateKey = toDateKey(d);
            holidaySetMonth.add(dateKey);
            holidayInfoMap.set(dateKey, { name: holiday.name || "Holiday" });
        }
    }

    // Approved leave date map
    const leaveDateMap = new Map();
    for (const leave of monthLeaves) {
        const leaveStart = new Date(leave.startDate);
        const leaveEnd = new Date(leave.endDate);
        const actualStart = leaveStart < monthStart ? new Date(monthStart) : new Date(leaveStart);
        const actualEnd = leaveEnd > monthEnd ? new Date(monthEnd) : new Date(leaveEnd);
        for (let d = new Date(actualStart); d <= actualEnd; d.setDate(d.getDate() + 1)) {
            const dateKey = toDateKey(d);
            leaveDateMap.set(dateKey, { status: "ON_LEAVE", type: leave.type || null });
        }
    }

    // Employee joining date
    const employeeJoinDate = new Date(employee.joiningDate || employee.createdAt);
    employeeJoinDate.setHours(0, 0, 0, 0);

    // ── Attendance calendar & counters ──────────────────────
    let presentDays = 0;
    let lateDays = 0;
    let absentDays = 0;
    let leaveDays = 0;
    let holidayDays = 0;
    let weekendDays = 0;
    let notJoinedDays = 0;

    const calendarData = [];
    const calculationEnd = new Date(now);
    calculationEnd.setHours(0, 0, 0, 0);

    for (let d = new Date(monthStart); d <= calculationEnd; d.setDate(d.getDate() + 1)) {
        const currentDate = new Date(d);
        currentDate.setHours(0, 0, 0, 0);
        const dateKey = toDateKey(currentDate);
        const dayOfWeek = currentDate.getDay();

        if (currentDate < employeeJoinDate) {
            notJoinedDays++;
            calendarData.push({ date: dateKey, status: "NOT_JOINED" });
            continue;
        }

        if (holidaySetMonth.has(dateKey)) {
            holidayDays++;
            calendarData.push({ date: dateKey, status: "HOLIDAY", holidayName: holidayInfoMap.get(dateKey)?.name || null });
            continue;
        }

        if (WEEKEND_DAYS.includes(dayOfWeek)) {
            weekendDays++;
            calendarData.push({ date: dateKey, status: "WEEKEND" });
            continue;
        }

        const leaveInfo = leaveDateMap.get(dateKey);
        if (leaveInfo) {
            leaveDays++;
            calendarData.push({ date: dateKey, status: "ON_LEAVE", leaveType: leaveInfo.type });
            continue;
        }

        const attendance = attendanceMap.get(dateKey);
        if (!attendance) {
            absentDays++;
            calendarData.push({ date: dateKey, status: "ABSENT" });
            continue;
        }

        if (attendance.status === "PRESENT") {
            presentDays++;
            calendarData.push({ date: dateKey, status: "PRESENT", checkIn: attendance.checkIn, checkOut: attendance.checkOut });
            continue;
        }

        if (attendance.status === "LATE") {
            lateDays++;
            calendarData.push({ date: dateKey, status: "LATE", checkIn: attendance.checkIn, checkOut: attendance.checkOut });
            continue;
        }

        if (attendance.status === "ABSENT") {
            absentDays++;
            calendarData.push({ date: dateKey, status: "ABSENT" });
            continue;
        }

        if (attendance.status === "WEEKEND") {
            weekendDays++;
            calendarData.push({ date: dateKey, status: "WEEKEND", checkIn: attendance.checkIn, checkOut: attendance.checkOut });
            continue;
        }

        absentDays++;
        calendarData.push({ date: dateKey, status: "ABSENT" });
    }

    // ── Attendance rate ─────────────────────────────────────
    const presentLikeDays = presentDays + lateDays + weekendDays + holidayDays + leaveDays;
    const totalElapsedDays = presentLikeDays + absentDays;
    const attendanceRate = totalElapsedDays > 0 ? Math.round((presentLikeDays / totalElapsedDays) * 100) : 0;
    const safeAttendanceRate = Math.min(100, Math.max(0, attendanceRate));

    // ── Today's worked time ─────────────────────────────────
    const clockedIn = todayAttendance?.checkIn != null;
    let workedMinutes = 0;
    if (clockedIn) {
        const checkoutTime = todayAttendance.checkOut || new Date();
        workedMinutes = Math.max(0, Math.floor((checkoutTime - new Date(todayAttendance.checkIn)) / 60000));
    }
    const workedHours = Math.floor(workedMinutes / 60);
    const workedMins = workedMinutes % 60;

    // ── Leave balance ───────────────────────────────────────
    const leaveBalance = {
        SICK: { used: 0, total: 14 },
        CASUAL: { used: 0, total: 10 },
        EARNED: { used: 0, total: 15 }
    };
    for (const leave of leaveByType) {
        if (leaveBalance[leave._id]) leaveBalance[leave._id].used = leave.count;
    }

    // ── Salary history ──────────────────────────────────────
    const salaryHistoryData = [...salaryHistory].reverse().map(p => ({
        label: `${MONTH_NAMES[p.month - 1]} ${p.year}`,
        netSalary: p.netSalary
    }));

    // ── Upcoming holidays ─────────────────────────────────────
    const todayDate = new Date(todayStart);
    todayDate.setHours(0, 0, 0, 0);

    const upcomingHolidays = nextHoliday.map(h => {
        const holidayStart = new Date(h.startDate);
        holidayStart.setHours(0, 0, 0, 0);
        const diff = Math.ceil((holidayStart - todayDate) / (1000 * 60 * 60 * 24));
        return {
            name: h.name,
            startDate: h.startDate,
            endDate: h.endDate,
            daysRemaining: Math.max(0, diff)
        };
    });

    return {
        role: "EMPLOYEE",
        employee: {
            ...employee,
            id: employee._id.toString()
        },
        attendanceRate: safeAttendanceRate,
        attendanceSummary: {
            totalDays: totalElapsedDays,
            presentDays,
            lateDays,
            leaveDays,
            holidayDays,
            weekendDays,
            absentDays,
            notJoinedDays,
            presentLikeDays
        },
        pendingLeaves,
        latestPayslip: latestPayslip ? { ...latestPayslip, id: latestPayslip._id.toString() } : null,
        salaryHistory: salaryHistoryData,
        leaveBalance,
        todayShift: isTodayWeekend
            ? { name: "Weekend", isWeekend: true }
            : holidaySetMonth.has(toDateKey(now))
                ? { name: holidayInfoMap.get(toDateKey(now))?.name || "Holiday", isHoliday: true }
                : todayShiftAssignment
                    ? {
                        name: todayShiftAssignment.shiftId?.name || "N/A",
                        startTime: todayShiftAssignment.shiftId?.startTime || "",
                        endTime: todayShiftAssignment.shiftId?.endTime || "",
                        isWeekend: false
                    }
                    : null,
        clockedIn,
        checkInTime: todayAttendance?.checkIn || null,
        workedTime: clockedIn ? `${workedHours}h ${workedMins}m` : null,
        attendanceCalendar: calendarData,
        upcomingHolidays
    };
};

// ─── Entry point (role-based dispatcher) ─────────────────────

export const getDashboard = async (session) => {
    if (session.role === "ADMIN") {
        return getAdminDashboard();
    }
    return getEmployeeDashboard(session);
};
