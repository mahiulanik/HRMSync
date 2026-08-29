import { DEPARTMENTS } from "../constants/departments.js"
import Attendance from "../models/attendanceModel.js"
import Employee from "../models/employeeModel.js"
import Leave from "../models/leaveModel.js"
import Payslip from "../models/payslipModel.js"
import Payroll from "../models/payrollModel.js"
import PublicHoliday from "../models/publicHolidayModel.js"
import ShiftAssignment from "../models/shiftAssignmentModel.js"

// Company weekend: Friday (5) & Saturday (6)
const WEEKEND_DAYS = [5, 6];
const isWeekend = (date) => WEEKEND_DAYS.includes(date.getDay());
const toDateKey = (date) => date.toISOString().split('T')[0];

export const getDashboard = async (session) => {
    if (session.role === "ADMIN") {
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setHours(24, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const startOf7DaysAgo = new Date(startOfToday);
        startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 6);

        const startOf30DaysAgo = new Date(startOfToday);
        startOf30DaysAgo.setDate(startOf30DaysAgo.getDate() - 29);

        const startOf6MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const [
            totalEmployees,
            activeEmployees,
            todayAttendanceRecords,
            pendingLeaves,
            recentEmployees,
            payrollThisMonth,
            overtimeResult,
            onLeaveToday,
            attendanceLast7Days,
            attendanceLast30Days,
            departmentAttendance,
            leaveRequests,
            employeeGrowth,
            upcomingHolidays
        ] = await Promise.all([
            Employee.countDocuments({ isDeleted: { $ne: true } }),

            Employee.countDocuments({ isDeleted: { $ne: true }, employeeStatus: "Active" }),

            Attendance.find({
                date: { $gte: startOfToday, $lt: endOfToday }
            }).lean(),

            Leave.countDocuments({ status: "PENDING" }),

            Employee.find({ isDeleted: { $ne: true } })
                .select('firstName lastName department position profilePic')
                .sort({ createdAt: -1 })
                .limit(8)
                .lean(),

            Payroll.findOne({
                month: now.getMonth() + 1,
                year: now.getFullYear()
            }).lean(),

            Attendance.aggregate([
                {
                    $match: {
                        date: { $gte: startOfToday, $lt: endOfToday },
                        overtimeMinutes: { $gt: 0 }
                    }
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
                {
                    $match: {
                        status: "APPROVED",
                        startDate: { $lte: endOfToday },
                        endDate: { $gte: startOfToday }
                    }
                },
                {
                    $count: "count"
                }
            ]),
            

            Attendance.aggregate([
                {
                    $match: {
                        date: { $gte: startOf7DaysAgo, $lt: endOfToday }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$date" }
                        },
                        present: {
                            $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] }
                        },
                        late: {
                            $sum: { $cond: [{ $eq: ["$status", "LATE"] }, 1, 0] }
                        },
                        absent: {
                            $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] }
                        }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            Attendance.aggregate([
                {
                    $match: {
                        date: { $gte: startOf30DaysAgo, $lt: endOfToday }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$date" }
                        },
                        present: {
                            $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] }
                        },
                        late: {
                            $sum: { $cond: [{ $eq: ["$status", "LATE"] }, 1, 0] }
                        },
                        absent: {
                            $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] }
                        }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            Employee.aggregate([
                {
                    $match: { isDeleted: { $ne: true } }
                },
                {
                    $group: {
                        _id: "$department",
                        total: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]).then(async (depts) => {
                const deptNames = depts.map(d => d._id).filter(Boolean);
                const deptAttendance = await Attendance.aggregate([
                    {
                        $match: {
                            date:  { $gte: startOfToday, $lt: endOfToday }
                        }
                    },
                    {
                        $lookup: {
                            from: "employees",
                            localField: "employeeId",
                            foreignField: "_id",
                            as: "employee"
                        }
                    },
                    { $unwind: "$employee" },
                    {
                        $match: {
                            "employee.isDeleted": { $ne: true }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                department: "$employee.department",
                                status: "$status"
                            },
                            count: { $sum: 1 }
                        }
                    }
                ]);

                const deptMap = {};
                for (const d of deptAttendance) {
                    const dept = d._id.department;
                    if (!deptMap[dept]) deptMap[dept] = { present: 0, late: 0, absent: 0, total: 0 };
                    if (d._id.status === "PRESENT") deptMap[dept].present = d.count;
                    if (d._id.status === "LATE") deptMap[dept].late = d.count;
                    if (d._id.status === "ABSENT") deptMap[dept].absent = d.count;
                    deptMap[dept].total += d.count;
                }

                const empCounts = {};
                for (const d of depts) {
                    empCounts[d._id] = d.total;
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
            }),

            Leave.aggregate([
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 }
                    }
                }
            ]),

            Employee.aggregate([
                {
                    $match: {
                        isDeleted: { $ne: true },
                        createdAt: { $gte: startOf6MonthsAgo }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } }
            ]),

            PublicHoliday.find({
                startDate: { $gte: now }
            })
                .sort({ startDate: 1 })
                .limit(5)
                .lean()
        ]);


        const [
            employeesForAbsence,
            leavesInRange,
            holidaysInRange
        ] = await Promise.all([
            Employee.find({ isDeleted: { $ne: true } }).select('createdAt').lean(),

            Leave.find({
                status: "APPROVED",
                startDate: { $lte: endOfToday },
                endDate: { $gte: startOf30DaysAgo }
            }).select('employeeId startDate endDate').lean(),

            PublicHoliday.find({
                startDate: { $lte: endOfToday },
                endDate: { $gte: startOf30DaysAgo }
            }).select('startDate endDate').lean()
        ]);

        const holidaySet = new Set();
        for (const h of holidaysInRange) {
            const s = new Date(h.startDate);
            const e = new Date(h.endDate);
            for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
                holidaySet.add(toDateKey(d));
            }
        }

        const leaveCountsByDate = {};
        for (const l of leavesInRange) {
            const s = new Date(Math.max(new Date(l.startDate).getTime(), startOf30DaysAgo.getTime()));
            const e = new Date(Math.min(new Date(l.endDate).getTime(), endOfToday.getTime()));
            for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
                const key = toDateKey(d);
                if (!leaveCountsByDate[key]) leaveCountsByDate[key] = new Set();
                leaveCountsByDate[key].add(String(l.employeeId));
            }
        }

        const countExpectedEmployees = (dateStr) => {
            const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);
            return employeesForAbsence.filter(e => new Date(e.createdAt) <= dayEnd).length;
        };

        const applyInferredAbsence = (series) => series.map(d => {
            const dateStr = d._id;
            const dateObj = new Date(`${dateStr}T00:00:00`);

            if (isWeekend(dateObj) || holidaySet.has(dateStr)) {
                return { ...d, absent: 0 };
            }

            const expected = countExpectedEmployees(dateStr);
            const onLeave = leaveCountsByDate[dateStr] ? leaveCountsByDate[dateStr].size : 0;
            const absent = Math.max(expected - d.present - d.late - onLeave, 0);

            return { ...d, absent };
        });

        const attendanceLast7DaysWithAbsence = applyInferredAbsence(attendanceLast7Days);
        const attendanceLast30DaysWithAbsence = applyInferredAbsence(attendanceLast30Days);

        const todayPresent = todayAttendanceRecords.filter(r => r.status === "PRESENT").length;
        const todayLate = todayAttendanceRecords.filter(r => r.status === "LATE").length;

        const attendanceRate = activeEmployees > 0
            ? Math.round(((todayPresent + todayLate) / activeEmployees) * 100)
            : 0;

        const overtimeHours = overtimeResult.length > 0
            ? Math.round(overtimeResult[0].totalOvertimeMinutes / 60 * 10) / 10
            : 0;

        const onLeaveCount = onLeaveToday.length > 0 ? onLeaveToday[0].count : 0;

        // Today's absent count uses the same inference, single day
        const todayDateStr = toDateKey(startOfToday);
        let todayAbsent = 0;
        if (!isWeekend(startOfToday) && !holidaySet.has(todayDateStr)) {
            const expectedToday = countExpectedEmployees(todayDateStr);
            todayAbsent = Math.max(expectedToday - todayPresent - todayLate - onLeaveCount, 0);
        }

        const leaveMap = {};
        for (const l of leaveRequests) {
            leaveMap[l._id] = l.count;
        }

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const employeeGrowthData = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const found = employeeGrowth.find(g => g._id.year === year && g._id.month === month);
            employeeGrowthData.push({
                month: monthNames[month - 1],
                employees: found ? found.count : 0
            });
        }

        const recentActiveCount = await Employee.countDocuments({
            isDeleted: { $ne: true },
            employeeStatus: "Active"
        });
        const recentInactiveCount = await Employee.countDocuments({
            isDeleted: { $ne: true },
            employeeStatus: "Inactive"
        });

        return {
            role: "ADMIN",
            totalEmployees,
            activeEmployees: recentActiveCount,
            inactiveEmployees: recentInactiveCount,
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
            attendanceLast7Days: attendanceLast7DaysWithAbsence,
            attendanceLast30Days: attendanceLast30DaysWithAbsence,
            departmentOverview: departmentAttendance,
            leaveRequests: {
                pending: leaveMap["PENDING"] || 0,
                approved: leaveMap["APPROVED"] || 0,
                rejected: leaveMap["REJECTED"] || 0
            },
            employeeGrowth: employeeGrowthData,
            recentEmployees,
            upcomingHolidays: upcomingHolidays.map(h => ({
                name: h.name,
                startDate: h.startDate,
                endDate: h.endDate
            }))
        };
    }

    const employee = await Employee.findOne({
        userId: session.userId
    }).lean();

    if (!employee) {
        throw new AppError("Employee not found", 404);
    }

// Date helper

const getDateKey = (date) => {
    const d = new Date(date);

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const today = new Date();

const startOfToday = new Date(today);
startOfToday.setHours(0, 0, 0, 0);

const endOfToday = new Date(today);
endOfToday.setHours(24, 0, 0, 0);

// Company weekend: Friday + Saturday
const isTodayWeekend = today.getDay() === 5 || today.getDay() === 6;

// Current month

const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

// Current year

const startOfYear = new Date(today.getFullYear(), 0, 1);
const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);

// Fetch dashboard data

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

    // Today's attendance
    Attendance.findOne({
        employeeId: employee._id,
        date: {
            $gte: startOfToday,
            $lt: endOfToday
        }
    }).lean(),

    // Current month's attendance
    Attendance.find({
        employeeId: employee._id,
        date: {
            $gte: startOfMonth,
            $lte: endOfMonth
        }
    })
        .select("status date checkIn checkOut")
        .lean(),

    // Pending leaves
    Leave.countDocuments({
        employeeId: employee._id,
        status: "PENDING"
    }),

    // Latest payslip
    Payslip.findOne({
        employeeId: employee._id
    })
        .sort({
            createdAt: -1
        })
        .lean(),

    // Salary history
    Payslip.find({
        employeeId: employee._id
    })
        .sort({
            year: -1,
            month: -1
        })
        .limit(3)
        .select(
            "month year netSalary grossSalary"
        )
        .lean(),

    // Today's shift
    ShiftAssignment.findOne({
        employeeId: employee._id,
        date: {
            $gte: startOfToday,
            $lt: endOfToday
        }
    })
        .populate(
            "shiftId",
            "name startTime endTime weekends"
        )
        .lean(),

    // Leave balance
    Leave.aggregate([
        {
            $match: {
                employeeId: employee._id,
                startDate: {
                    $gte: startOfYear,
                    $lte: endOfYear
                },
                status: {
                    $in: [
                        "APPROVED",
                        "PENDING"
                    ]
                }
            }
        },
        {
            $group: {
                _id: "$type",
                count: {
                    $sum: 1
                }
            }
        }
    ]),

    // Approved leaves overlapping current month
    Leave.find({
        employeeId: employee._id,
        status: "APPROVED",
        startDate: {
            $lte: endOfMonth
        },
        endDate: {
            $gte: startOfMonth
        }
    })
        .select(
            "startDate endDate type"
        )
        .lean(),

    // Next public holiday

    PublicHoliday.findOne({
        endDate: {
            $gte: startOfToday
        }
    })
        .sort({
            startDate: 1
        })
        .lean()
    ]);

// Attendance map

const attendanceMap = new Map();

for (const record of monthAttendanceRecords) {
    const dateKey = getDateKey(record.date);

    attendanceMap.set(dateKey, {
        status: String(record.status || "").toUpperCase(),
        date: record.date,
        checkIn: record.checkIn || null,
        checkOut: record.checkOut || null
    });
}

// Public holidays

const holidaysThisMonth =
    await PublicHoliday.find({
        startDate: {
            $lte: endOfMonth
        },
        endDate: {
            $gte: startOfMonth
        }
    })
        .select(
            "name startDate endDate"
        )
        .lean();

const holidaySetMonth = new Set();

const holidayInfoMap = new Map();

for (const holiday of holidaysThisMonth) {

    const holidayStart = new Date(holiday.startDate);
    const holidayEnd = new Date(holiday.endDate);

    for (
        let d = new Date(holidayStart);
        d <= holidayEnd;
        d.setDate(
            d.getDate() + 1
        )
    ) {
        const dateKey =
            getDateKey(d);

        holidaySetMonth.add(
            dateKey
        );

        holidayInfoMap.set(
            dateKey,
            {
                name: holiday.name || "Holiday"
            }
        );
    }
}

// Approved leave date map

const leaveDateMap = new Map();

for (const leave of monthLeaves) {

    const leaveStart = new Date(leave.startDate);
    const leaveEnd = new Date(leave.endDate);
    const actualStart = leaveStart < startOfMonth ? new Date(startOfMonth) : new Date(leaveStart);
    const actualEnd = leaveEnd > endOfMonth ? new Date(endOfMonth) : new Date(leaveEnd);

    for (
        let d = new Date(actualStart);
        d <= actualEnd;
        d.setDate(
            d.getDate() + 1
        )
    ) {
        const dateKey =
            getDateKey(d);

        leaveDateMap.set(
            dateKey,
            {
                status: "ON_LEAVE",
                type:
                    leave.type || null
            }
        );
    }
}

// Employee joining date

const employeeJoinDate = new Date(employee.joiningDate || employee.createdAt);

employeeJoinDate.setHours(0, 0, 0, 0);

// ------------------------------------------------------------
// Attendance counters
//
// Business rule:
//
// PRESENT  = Present
// LATE     = Present
// WEEKEND  = Present
// HOLIDAY  = Present
// ON_LEAVE = Present
// ABSENT   = Absent
//
// Only ABSENT reduces attendance percentage.
// ------------------------------------------------------------

let presentDays = 0;
let lateDays = 0;
let absentDays = 0;
let leaveDays = 0;
let holidayDays = 0;
let weekendDays = 0;
let notJoinedDays = 0;

const calendarData = [];

// Only calculate elapsed days

const calculationEnd = new Date(today);

calculationEnd.setHours(0, 0, 0, 0);

    for (
        let d = new Date(startOfMonth);
        d <= calculationEnd;
        d.setDate(
            d.getDate() + 1
        )
    ) {

    const currentDate = new Date(d);

    currentDate.setHours(0, 0, 0, 0);

    const dateKey = getDateKey(currentDate);

    const dayOfWeek = currentDate.getDay();

    // Employee not joined yet

    if (currentDate < employeeJoinDate) {
        notJoinedDays++;

        calendarData.push({
            date: dateKey,
            status: "NOT_JOINED"
        });

        continue;
    }

    // Public holiday

    if (holidaySetMonth.has(dateKey
        )
    ) {

        holidayDays++;

        calendarData.push({
            date: dateKey,
            status: "HOLIDAY",
            holidayName:
                holidayInfoMap.get(
                    dateKey
                )?.name || null
        });

        continue;
    }

    // Weekend
    // Friday + Saturday

    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

    if (isWeekend) {
        weekendDays++;

        calendarData.push({
            date: dateKey,
            status: "WEEKEND"
        });

        continue;
    }

    // ON_LEAVE = PRESENT

    const leaveInfo = leaveDateMap.get(dateKey);

    if (leaveInfo) {
        leaveDays++;

        calendarData.push({
            date: dateKey,
            status: "ON_LEAVE",
            leaveType:
                leaveInfo.type
        });

        continue;
    }

    const attendance = attendanceMap.get(dateKey);

    if (!attendance) {
        absentDays++;

        calendarData.push({
            date: dateKey,
            status: "ABSENT"
        });

        continue;
    }


    if (attendance.status === "PRESENT") {
        presentDays++;

        calendarData.push({
            date: dateKey,
            status: "PRESENT",
            checkIn:
                attendance.checkIn,
            checkOut:
                attendance.checkOut
        });

        continue;
    }

    if (attendance.status === "LATE") {
        lateDays++;

        calendarData.push({
            date: dateKey,
            status: "LATE",
            checkIn:
                attendance.checkIn,
            checkOut:
                attendance.checkOut
        });

        continue;
    }

    if (attendance.status === "ABSENT") {
        absentDays++;

        calendarData.push({
            date: dateKey,
            status: "ABSENT"
        });

        continue;
    }

    if (attendance.status === "WEEKEND") {
        weekendDays++;

        calendarData.push({
            date: dateKey,
            status: "WEEKEND",
            checkIn:
                attendance.checkIn,
            checkOut:
                attendance.checkOut
        });

        continue;
    }

    absentDays++;

    calendarData.push({
        date: dateKey,
        status: "ABSENT"
    });
}

// Everything except ABSENT / NOT_JOINED
// is treated as present for attendance rate.
// ------------------------------------------------------------

const presentLikeDays = presentDays + lateDays + weekendDays + holidayDays + leaveDays;

const totalElapsedDays = presentLikeDays + absentDays;

const attendanceRate = totalElapsedDays > 0  ? Math.round((presentLikeDays / totalElapsedDays) * 100) : 0;

// Safety clamp

const safeAttendanceRate = Math.min(100, Math.max(0, attendanceRate));

const clockedIn = todayAttendance?.checkIn != null;

let workedMinutes = 0;

if (clockedIn) {

    const checkoutTime = todayAttendance.checkOut || new Date();

    workedMinutes =
        Math.max(
            0,
            Math.floor(
                (
                    checkoutTime -
                    new Date(
                        todayAttendance.checkIn
                    )
                ) / 60000
            )
        );
}

const workedHours = Math.floor(workedMinutes / 60);

const workedMins = workedMinutes % 60;

const leaveBalance = {
    SICK: {
        used: 0,
        total: 14
    },

    CASUAL: {
        used: 0,
        total: 10
    },

    EARNED: {
        used: 0,
        total: 15
    }
};

for (const leave of leaveByType) {

    if (
        leaveBalance[
            leave._id
        ]
    ) {
        leaveBalance[
            leave._id
        ].used =
            leave.count;
    }
}

// ------------------------------------------------------------
// Salary history
// ------------------------------------------------------------

const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
];

const salaryHistoryData = [...salaryHistory]
        .reverse()
        .map((p) => ({
            label:
                `${monthNames[p.month - 1]} ${p.year}`,

            netSalary:
                p.netSalary
        }));

// ------------------------------------------------------------
// Next holiday
// ------------------------------------------------------------

let daysUntilHoliday = null;

if (nextHoliday) {
    const holidayStart = new Date(nextHoliday.startDate);
    holidayStart.setHours(0, 0, 0, 0);

    const todayDate = new Date(startOfToday);
    todayDate.setHours(0, 0, 0, 0);

    const diff = Math.ceil(
        (holidayStart - todayDate) /
        (1000 * 60 * 60 * 24)
    );

    daysUntilHoliday = Math.max(0, diff);
}

return {
    role: "EMPLOYEE",
    employee: {
        ...employee,
        id: employee._id.toString()
    },
    attendanceRate: safeAttendanceRate,
    attendanceSummary: {
        totalDays: totalElapsedDays,
        presentDays: presentDays,
        lateDays: lateDays,
        leaveDays: leaveDays,
        holidayDays: holidayDays,
        weekendDays: weekendDays,
        absentDays: absentDays,
        notJoinedDays: notJoinedDays,
        presentLikeDays: presentLikeDays
    },
    pendingLeaves,
    latestPayslip: latestPayslip ? {...latestPayslip, id: latestPayslip._id.toString()} : null,
    salaryHistory: salaryHistoryData,
    leaveBalance,
    todayShift:
        isTodayWeekend
            ? {
                name: "Weekend",
                isWeekend: true
            }
            : todayShiftAssignment
                ? {
                    name:
                        todayShiftAssignment
                            .shiftId
                            ?.name ||
                        "N/A",
                    startTime:
                        todayShiftAssignment
                            .shiftId
                            ?.startTime ||
                        "",
                    endTime:
                        todayShiftAssignment
                            .shiftId
                            ?.endTime ||
                        "",
                    isWeekend: false
                }
                : null,
    clockedIn,
    checkInTime: todayAttendance?.checkIn || null,
    workedTime: clockedIn ? `${workedHours}h ${workedMins}m` : null,
    attendanceCalendar: calendarData,
    nextHoliday:
        nextHoliday

            ? {
                name:
                    nextHoliday.name,

                startDate:
                    nextHoliday.startDate,

                endDate:
                    nextHoliday.endDate,

                daysRemaining:
                    daysUntilHoliday
            }

            : null
};
};