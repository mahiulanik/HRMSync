import Attendance from "../models/attendanceModel.js";
import Employee from "../models/employeeModel.js";
import ShiftAssignment from "../models/shiftAssignmentModel.js";
import PublicHoliday from "../models/publicHolidayModel.js";
import Leave from "../models/leaveModel.js";
import AppError from "../utils/AppError.js";
import {
    nowInDhaka, toDateKey, startOfDayDhaka, endOfDayDhaka,
    startOfMonthDhaka, endOfMonthDhaka, isWeekendDate, WEEKEND_DAYS
} from "../utils/dateHelpers.js";

// ─── Reusable Checkout Helper ─────────────────────────────────

const processCheckout = (record, nowUTC, shift) => {
    record.checkOut = nowUTC;

    const checkInTime = new Date(record.checkIn).getTime();
    const diffMs = nowUTC.getTime() - checkInTime;
    const workingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    let dayType = "Half Day";
    if (workingHours >= 8) dayType = "Full Day";

    let overtimeMinutes = 0;
    if (shift) {
        const [endHour, endMinute] = shift.endTime.split(":").map(Number);
        const nowDhaka = nowInDhaka();
        const shiftEnd = new Date(nowDhaka);
        shiftEnd.setHours(endHour, endMinute, 0, 0);
        if (nowDhaka > shiftEnd) {
            overtimeMinutes = Math.floor((nowDhaka.getTime() - shiftEnd.getTime()) / (1000 * 60));
        }
    }

    record.workingHours = workingHours;
    record.dayType = dayType;
    record.overtimeMinutes = overtimeMinutes;

    return record;
};

// ─── Clock In / Out ──────────────────────────────────────────

export const clockInOut = async (session) => {
    const employee = await Employee.findOne({ userId: session.userId });

    if (!employee) {
        throw new AppError("Employee not found", 404);
    }

    if (employee.isDeleted) {
        throw new AppError("Your account is deactivated, you cannot clock in/out", 403);
    }

    const nowUTC = new Date();              // actual UTC for storing timestamps
    const nowDhaka = nowInDhaka();           // Dhaka-shifted for comparisons
    const todayStart = startOfDayDhaka(0);
    const todayEnd = endOfDayDhaka();

    // Fetch shift assignment
    let shift = null;
    try {
        const assignment = await ShiftAssignment.findOne({
            employeeId: employee._id,
            date: { $gte: todayStart, $lte: todayEnd }
        }).populate("shiftId");

        if (assignment?.shiftId) {
            shift = assignment.shiftId;
        }
    } catch {
        // Shift assignment failure should not stop clock in/out
    }

    // Check existing attendance for today
    let existing = await Attendance.findOne({
        employeeId: employee._id,
        date: { $gte: todayStart, $lte: todayEnd }
    });

    // CHECK OUT
    if (existing) {
        if (!existing.checkOut) {
            processCheckout(existing, nowUTC, shift);
            await existing.save();
            return { success: true, type: "CHECK_OUT", data: existing };
        }
        return { success: true, type: "ALREADY_CHECKED_OUT", data: existing };
    }

    // CHECK IN
    let status = "PRESENT";
    let lateMinutes = 0;

    if (shift?.weekends?.includes(nowDhaka.getDay())) {
        status = "WEEKEND";
    } else if (shift) {
        const [startHour, startMinute] = shift.startTime.split(":").map(Number);
        const shiftStart = new Date(nowDhaka);
        shiftStart.setHours(startHour, startMinute, 0, 0);

        const graceEnd = new Date(shiftStart.getTime() + shift.graceMinutes * 60 * 1000);

        if (nowDhaka > graceEnd) {
            status = "LATE";
            lateMinutes = Math.floor((nowDhaka.getTime() - graceEnd.getTime()) / (1000 * 60));
        }
    }

    try {
        existing = await Attendance.create({
            employeeId: employee._id,
            shiftId: shift?._id || null,
            date: todayStart,
            checkIn: nowUTC,
            status,
            lateMinutes,
            overtimeMinutes: 0,
        });
    } catch (err) {
        // Concurrent clock-in: race condition fallback
        if (err.code === 11000) {
            existing = await Attendance.findOne({
                employeeId: employee._id,
                date: { $gte: todayStart, $lte: todayEnd }
            });

            if (existing && !existing.checkOut) {
                processCheckout(existing, nowUTC, shift);
                await existing.save();
                return { success: true, type: "CHECK_OUT", data: existing };
            }

            if (existing) {
                return { success: true, type: "ALREADY_CHECKED_OUT", data: existing };
            }

            throw new AppError("Clock in failed, please try again", 500);
        }
        throw err;
    }

    return { success: true, type: "CHECK_IN", data: existing };
};

// ─── Reusable: Build Month Attendance ─────────────────────────

const buildMonthAttendance = async (employeeId, startDate, endDate, joiningDate) => {
    const dateKey = (d) => toDateKey(d);

    // Batch all queries for this employee
    const [shifts, records, approvedLeaves, holidays] = await Promise.all([
        ShiftAssignment.find({
            employeeId,
            date: { $gte: startDate, $lte: endDate }
        }).populate("shiftId").lean(),

        Attendance.find({
            employeeId,
            date: { $gte: startDate, $lte: endDate }
        }).lean(),

        Leave.find({
            employeeId,
            status: "APPROVED",
            startDate: { $lte: endDate },
            endDate: { $gte: startDate }
        }).lean(),

        PublicHoliday.find({
            startDate: { $lte: endDate },
            endDate: { $gte: startDate }
        }).lean()
    ]);

    // Build lookup maps
    const shiftMap = {};
    shifts.forEach(s => { shiftMap[dateKey(s.date)] = s; });

    const recordMap = {};
    records.forEach(r => { recordMap[dateKey(r.date)] = r; });

    const leaveMap = {};
    approvedLeaves.forEach(leave => {
        const s = new Date(leave.startDate);
        const e = new Date(leave.endDate);
        s.setHours(0, 0, 0, 0);
        e.setHours(0, 0, 0, 0);
        const cur = new Date(s);
        while (cur <= e) {
            leaveMap[dateKey(cur)] = leave;
            cur.setDate(cur.getDate() + 1);
        }
    });

    const holidayMap = {};
    holidays.forEach(h => {
        const s = new Date(h.startDate);
        const e = new Date(h.endDate);
        s.setHours(0, 0, 0, 0);
        e.setHours(23, 59, 59, 999);
        const cur = new Date(s);
        while (cur <= e) {
            holidayMap[dateKey(cur)] = h;
            cur.setDate(cur.getDate() + 1);
        }
    });

    const empJoining = joiningDate ? new Date(joiningDate) : null;
    if (empJoining) empJoining.setHours(0, 0, 0, 0);

    const result = [];
    const current = new Date(startDate);

    while (current <= endDate) {
        const dk = dateKey(current);
        const dayOfWeek = current.getDay();

        if (empJoining && current < empJoining) {
            current.setDate(current.getDate() + 1);
            continue;
        }

        const existing = recordMap[dk];
        const approvedLeave = leaveMap[dk];
        const holiday = holidayMap[dk];

        // 1. HOLIDAY HAS HIGHEST PRIORITY
        if (holiday) {
            result.push({
                ...(existing || {}),
                _id: existing?._id || `holiday-${employeeId}-${dk}`,
                employeeId,
                date: existing?.date || new Date(current),
                status: "HOLIDAY",
                checkIn: existing?.checkIn || null,
                checkOut: existing?.checkOut || null,
                workingHours: existing?.workingHours || 0,
                dayType: "Holiday",
                holidayName: holiday.name,
                lateMinutes: existing?.lateMinutes || 0,
                overtimeMinutes: existing?.overtimeMinutes || 0,
                isVirtual: !existing,
            });
            current.setDate(current.getDate() + 1);
            continue;
        }

        // 2. EXISTING ATTENDANCE
        if (existing) {
            if (approvedLeave && existing.status === "ABSENT") {
                result.push({
                    ...existing,
                    status: approvedLeave.leaveType || approvedLeave.leaveName || approvedLeave.name
                });
            } else {
                result.push(existing);
            }
            current.setDate(current.getDate() + 1);
            continue;
        }

        // 3. WEEKEND (check shift assignment for custom weekend config)
        const shiftAssignment = shiftMap[dk];

        if (shiftAssignment?.shiftId) {
            const shift = shiftAssignment.shiftId;

            if (shift.weekends && shift.weekends.includes(dayOfWeek)) {
                result.push({
                    _id: `weekend-${employeeId}-${dk}`,
                    employeeId,
                    date: new Date(current),
                    status: "WEEKEND",
                    shiftName: shift.name,
                    isVirtual: true,
                });
                current.setDate(current.getDate() + 1);
                continue;
            }
        }

        // 4. ABSENT / LEAVE
        if (shiftAssignment?.shiftId) {
            result.push({
                _id: `absent-${employeeId}-${dk}`,
                employeeId,
                date: new Date(current),
                status: approvedLeave ? approvedLeave.type : "ABSENT",
                checkIn: null,
                checkOut: null,
                workingHours: null,
                dayType: null,
                lateMinutes: 0,
                overtimeMinutes: 0,
                shiftName: shiftAssignment.shiftId.name,
                isVirtual: true,
            });
        }

        current.setDate(current.getDate() + 1);
    }

    result.sort((a, b) => new Date(a.date) - new Date(b.date));
    return result;
};

// ─── Employee Attendance ──────────────────────────────────────

export const getAttendance = async (session, query) => {
    const employee = await Employee.findOne({ userId: session.userId });

    if (!employee) {
        throw new AppError("Employee not found", 404);
    }

    const now = nowInDhaka();
    const month = parseInt(query.month) || (now.getMonth() + 1);
    const year = parseInt(query.year) || now.getFullYear();

    const startDate = startOfMonthDhaka(year, month);
    let endDate = endOfMonthDhaka(year, month);

    // Cap at today if viewing current month
    if (year === now.getFullYear() && month === now.getMonth() + 1) {
        endDate.setHours(23, 59, 59, 999);
        if (endDate > now) endDate = now;
        endDate.setHours(23, 59, 59, 999);
    }

    const data = await buildMonthAttendance(employee._id, startDate, endDate, employee.joiningDate);

    return {
        data,
        employee: { isDeleted: employee.isDeleted },
    };
};

// ─── Admin Attendance ─────────────────────────────────────────

export const getAdminAttendance = async (query) => {
    const { month, year, department, employeeId } = query;

    const now = nowInDhaka();
    const m = parseInt(month) || (now.getMonth() + 1);
    const y = parseInt(year) || now.getFullYear();

    const startDate = startOfMonthDhaka(y, m);
    const endDate = endOfMonthDhaka(y, m);

    // Build employee filter
    const empFilter = { isDeleted: { $ne: true } };
    if (department) empFilter.department = department;
    if (employeeId) empFilter._id = employeeId;

    const employees = await Employee.find(empFilter)
        .select("firstName lastName department position joiningDate")
        .limit(200);

    if (employees.length === 0) {
        return {
            data: [],
            employees: [],
            summary: {
                totalEmployees: 0,
                totalRecords: 0,
                presentDays: 0,
                lateDays: 0,
                absentDays: 0,
                avgHours: 0,
            },
            month: m,
            year: y,
        };
    }

    const employeeIds = employees.map(e => e._id);

    // Batch all queries for ALL employees at once (no N+1)
    const [allShifts, allRecords, allLeaves, allHolidays] = await Promise.all([
        ShiftAssignment.find({
            employeeId: { $in: employeeIds },
            date: { $gte: startDate, $lte: endDate }
        }).populate("shiftId").lean(),

        Attendance.find({
            employeeId: { $in: employeeIds },
            date: { $gte: startDate, $lte: endDate }
        }).lean(),

        Leave.find({
            employeeId: { $in: employeeIds },
            status: "APPROVED",
            startDate: { $lte: endDate },
            endDate: { $gte: startDate }
        }).lean(),

        PublicHoliday.find({
            startDate: { $lte: endDate },
            endDate: { $gte: startDate }
        }).lean()
    ]);

    // Build global lookup maps (keyed by `employeeId-dateKey`)
    const shiftMap = {};
    allShifts.forEach(s => {
        const key = `${s.employeeId}-${toDateKey(s.date)}`;
        shiftMap[key] = s;
    });

    const recordMap = {};
    allRecords.forEach(r => {
        const key = `${r.employeeId}-${toDateKey(r.date)}`;
        recordMap[key] = r;
    });

    const leaveMap = {};
    allLeaves.forEach(leave => {
        const s = new Date(leave.startDate);
        const e = new Date(leave.endDate);
        s.setHours(0, 0, 0, 0);
        e.setHours(0, 0, 0, 0);
        const cur = new Date(s);
        while (cur <= e) {
            const key = `${leave.employeeId}-${toDateKey(cur)}`;
            leaveMap[key] = leave;
            cur.setDate(cur.getDate() + 1);
        }
    });

    const holidayMap = {};
    allHolidays.forEach(h => {
        const s = new Date(h.startDate);
        const e = new Date(h.endDate);
        s.setHours(0, 0, 0, 0);
        e.setHours(23, 59, 59, 999);
        const cur = new Date(s);
        while (cur <= e) {
            holidayMap[toDateKey(cur)] = h;
            cur.setDate(cur.getDate() + 1);
        }
    });

    // Build attendance for each employee using shared maps
    const allAttendance = [];

    for (const emp of employees) {
        const empId = emp._id;
        const empJoining = emp.joiningDate ? new Date(emp.joiningDate) : null;
        if (empJoining) empJoining.setHours(0, 0, 0, 0);

        const current = new Date(startDate);
        while (current <= endDate) {
            const dk = toDateKey(current);
            const compositeKey = `${empId}-${dk}`;
            const dayOfWeek = current.getDay();

            if (empJoining && current < empJoining) {
                current.setDate(current.getDate() + 1);
                continue;
            }

            const existing = recordMap[compositeKey];
            const approvedLeave = leaveMap[compositeKey];
            const holiday = holidayMap[dk]; // holidays are global, not per-employee

            // 1. HOLIDAY
            if (holiday) {
                allAttendance.push({
                    ...(existing || {}),
                    _id: existing?._id || `holiday-${empId}-${dk}`,
                    employeeId: {
                        _id: emp._id,
                        firstName: emp.firstName,
                        lastName: emp.lastName,
                        department: emp.department,
                        position: emp.position,
                    },
                    date: existing?.date || new Date(current),
                    status: "HOLIDAY",
                    checkIn: existing?.checkIn || null,
                    checkOut: existing?.checkOut || null,
                    workingHours: existing?.workingHours || 0,
                    dayType: "Holiday",
                    holidayName: holiday.name,
                    lateMinutes: existing?.lateMinutes || 0,
                    overtimeMinutes: existing?.overtimeMinutes || 0,
                    isVirtual: !existing,
                });
                current.setDate(current.getDate() + 1);
                continue;
            }

            // 2. EXISTING ATTENDANCE
            if (existing) {
                const record = { ...existing };
                if (approvedLeave && existing.status === "ABSENT") {
                    record.status = approvedLeave.leaveType || approvedLeave.leaveName || approvedLeave.name;
                }
                record.employeeId = {
                    _id: emp._id,
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    department: emp.department,
                    position: emp.position,
                };
                allAttendance.push(record);
                current.setDate(current.getDate() + 1);
                continue;
            }

            // 3. WEEKEND
            const shiftAssignment = shiftMap[compositeKey];

            if (shiftAssignment?.shiftId) {
                const shift = shiftAssignment.shiftId;
                if (shift.weekends && shift.weekends.includes(dayOfWeek)) {
                    allAttendance.push({
                        _id: `weekend-${empId}-${dk}`,
                        employeeId: {
                            _id: emp._id,
                            firstName: emp.firstName,
                            lastName: emp.lastName,
                            department: emp.department,
                            position: emp.position,
                        },
                        date: new Date(current),
                        status: "WEEKEND",
                        shiftName: shift.name,
                        isVirtual: true,
                    });
                    current.setDate(current.getDate() + 1);
                    continue;
                }
            }

            // 4. ABSENT / LEAVE
            if (shiftAssignment?.shiftId) {
                allAttendance.push({
                    _id: `absent-${empId}-${dk}`,
                    employeeId: {
                        _id: emp._id,
                        firstName: emp.firstName,
                        lastName: emp.lastName,
                        department: emp.department,
                        position: emp.position,
                    },
                    date: new Date(current),
                    status: approvedLeave ? approvedLeave.type : "ABSENT",
                    checkIn: null,
                    checkOut: null,
                    workingHours: null,
                    dayType: null,
                    lateMinutes: 0,
                    overtimeMinutes: 0,
                    shiftName: shiftAssignment.shiftId.name,
                    isVirtual: true,
                });
            }

            current.setDate(current.getDate() + 1);
        }
    }

    allAttendance.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Summary stats
    const presentStatuses = ["PRESENT", "LATE", "WEEKEND", "SICK", "CASUAL", "EARNED", "HOLIDAY"];
    const presentDays = allAttendance.filter(a => presentStatuses.includes(a.status)).length;
    const lateDays = allAttendance.filter(a => a.status === "LATE").length;
    const absentDays = allAttendance.filter(a => a.status === "ABSENT").length;
    const totalWorkingHours = allAttendance.reduce((sum, a) => sum + (a.workingHours || 0), 0);
    const workDaysCount = allAttendance.filter(a => a.workingHours).length;
    const avgHours = workDaysCount > 0 ? (totalWorkingHours / workDaysCount).toFixed(1) : "0";

    return {
        data: allAttendance,
        employees: employees.map(e => ({
            _id: e._id,
            firstName: e.firstName,
            lastName: e.lastName,
            department: e.department,
            position: e.position,
        })),
        summary: {
            totalEmployees: employees.length,
            totalRecords: allAttendance.length,
            presentDays,
            lateDays,
            absentDays,
            avgHours: parseFloat(avgHours),
        },
        month: m,
        year: y,
    };
};

// ─── Today's Attendance Status (for employee cards) ──────────

export const getTodayAttendanceStatus = async () => {
    const todayStart = startOfDayDhaka(0);
    const todayEnd = endOfDayDhaka();

    const now = nowInDhaka();
    const isWeekendDay = isWeekendDate(now);

    const records = await Attendance.find({
        date: { $gte: todayStart, $lt: todayEnd }
    }).select("employeeId status").lean();

    const statusMap = {};
    for (const r of records) {
        statusMap[String(r.employeeId)] = r.status;
    }

    return { statusMap, isWeekend: isWeekendDay };
};
