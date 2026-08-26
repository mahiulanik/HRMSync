import { DEPARTMENTS } from "../constants/departments.js"
import Attendance from "../models/attendanceModel.js"
import Employee from "../models/employeeModel.js"
import Leave from "../models/leaveModel.js"
import Payslip from "../models/payslipModel.js"
import Payroll from "../models/payrollModel.js"
import PublicHoliday from "../models/publicHolidayModel.js"
import Shift from "../models/shiftModel.js"
import ShiftAssignment from "../models/shiftAssignmentModel.js"

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
                            date: { $gte: startOfMonth, $lte: endOfMonth }
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
                    const totalRecords = attendance.present + attendance.late + attendance.absent;
                    const rate = totalRecords > 0 ? Math.round(((attendance.present + attendance.late) / totalRecords) * 100) : 0;
                    return {
                        department: dept,
                        totalEmployees: empCounts[dept] || 0,
                        attendanceRate: rate,
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

        const todayPresent = todayAttendanceRecords.filter(r => r.status === "PRESENT").length;
        const todayLate = todayAttendanceRecords.filter(r => r.status === "LATE").length;
        const todayAbsent = todayAttendanceRecords.filter(r => r.status === "ABSENT").length;

        const attendanceRate = activeEmployees > 0
            ? Math.round(((todayPresent + todayLate) / activeEmployees) * 100)
            : 0;

        const overtimeHours = overtimeResult.length > 0
            ? Math.round(overtimeResult[0].totalOvertimeMinutes / 60 * 10) / 10
            : 0;

        const onLeaveCount = onLeaveToday.length > 0 ? onLeaveToday[0].count : 0;

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
            attendanceLast7Days,
            attendanceLast30Days,
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

    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(24, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);

    const [
        todayAttendance,
        monthAttendanceRecords,
        pendingLeaves,
        latestPayslip,
        salaryHistory,
        todayShiftAssignment,
        attendanceCalendar,
        monthLeaves,
        leaveByType,
        nextHoliday
    ] = await Promise.all([
        Attendance.findOne({
            employeeId: employee._id,
            date: { $gte: startOfToday, $lt: endOfToday }
        }).lean(),

        Attendance.find({
            employeeId: employee._id,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        }).select('status date').lean(),

        Leave.countDocuments({
            employeeId: employee._id,
            status: "PENDING"
        }),

        Payslip.findOne({
            employeeId: employee._id
        }).sort({ createdAt: -1 }).lean(),

        Payslip.find({
            employeeId: employee._id
        }).sort({ year: -1, month: -1 }).limit(3).select('month year netSalary grossSalary').lean(),

        ShiftAssignment.findOne({
            employeeId: employee._id,
            date: { $gte: startOfToday, $lt: endOfToday }
        }).populate('shiftId', 'name startTime endTime weekends').lean(),

        Attendance.find({
            employeeId: employee._id,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        }).select('status date').lean(),

        Leave.aggregate([
            {
                $match: {
                    employeeId: employee._id,
                    startDate: { $gte: startOfYear, $lte: endOfYear },
                    status: { $in: ["APPROVED", "PENDING"] }
                }
            },
            {
                $group: {
                    _id: "$type",
                    count: { $sum: 1 }
                }
            }
        ]),

         Leave.find({
        employeeId: employee._id,
        status: "APPROVED",
        startDate: { $lte: endOfMonth },
        endDate: { $gte: startOfMonth }
    }).select('startDate endDate type').lean(),

        PublicHoliday.findOne({
            startDate: { $gte: today }
        }).sort({ startDate: 1 }).lean()
    ]);

    const monthPresent = monthAttendanceRecords.filter(r => r.status === "PRESENT" || r.status === "LATE").length;
    const totalWorkingDays = monthAttendanceRecords.length;
    const attendanceRate = totalWorkingDays > 0
        ? Math.round((monthPresent / totalWorkingDays) * 100)
        : 0;

    const clockedIn = todayAttendance?.checkIn != null;
    let workedMinutes = 0;
    if (clockedIn) {
        const checkoutTime = todayAttendance.checkOut || new Date();
        workedMinutes = Math.floor((checkoutTime - new Date(todayAttendance.checkIn)) / 60000);
    }
    const workedHours = Math.floor(workedMinutes / 60);
    const workedMins = workedMinutes % 60;

    const leaveBalance = {
        SICK: { used: 0, total: 14 },
        CASUAL: { used: 0, total: 10 },
        EARNED: { used: 0, total: 15 }
    };
    for (const lt of leaveByType) {
        if (leaveBalance[lt._id]) {
            leaveBalance[lt._id].used = lt.count;
        }
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const salaryHistoryData = salaryHistory.reverse().map(p => ({
        label: `${monthNames[p.month - 1]} ${p.year}`,
        netSalary: p.netSalary
    }));

    const leaveDates = new Set();
    for (const leave of monthLeaves) {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const s = new Date(Math.max(start.getTime(), startOfMonth.getTime()));
        const e = new Date(Math.min(end.getTime(), endOfMonth.getTime()));
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
            leaveDates.add(d.toISOString().split('T')[0]);
        }
    }

    const calendarData = attendanceCalendar.map(r => ({
        date: r.date,
        status: r.status
    }));

    for (const dateStr of leaveDates) {
        if (!calendarData.find(c => {
            const cDate = new Date(c.date);
            return cDate.toISOString().split('T')[0] === dateStr;
        })) {
            calendarData.push({ date: new Date(dateStr + 'T00:00:00'), status: 'ON_LEAVE' });
        }
    }

    let daysUntilHoliday = null;
    if (nextHoliday) {
        const diff = Math.ceil((new Date(nextHoliday.startDate) - today) / (1000 * 60 * 60 * 24));
        daysUntilHoliday = diff <= 0 ? 0 : diff;
    }

    return {
        role: "EMPLOYEE",
        employee: {
            ...employee,
            id: employee._id.toString()
        },
        attendanceRate,
        pendingLeaves,
        latestPayslip: latestPayslip ? { ...latestPayslip, id: latestPayslip._id.toString() } : null,
        salaryHistory: salaryHistoryData,
        leaveBalance,
        todayShift: todayShiftAssignment ? {
            name: todayShiftAssignment.shiftId?.name || 'N/A',
            startTime: todayShiftAssignment.shiftId?.startTime || '',
            endTime: todayShiftAssignment.shiftId?.endTime || ''
        } : null,
        clockedIn,
        checkInTime: todayAttendance?.checkIn || null,
        workedTime: clockedIn ? `${workedHours}h ${workedMins}m` : null,
        attendanceCalendar: calendarData,
        nextHoliday: nextHoliday ? {
            name: nextHoliday.name,
            startDate: nextHoliday.startDate,
            endDate: nextHoliday.endDate,
            daysRemaining: daysUntilHoliday
        } : null
    };
};