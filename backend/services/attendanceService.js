import Attendance from "../models/attendanceModel.js"
import Employee from "../models/employeeModel.js"
import ShiftAssignment from "../models/shiftAssignmentModel.js"
import PublicHoliday from "../models/publicHolidayModel.js"



export const clockInOut = async (session) => {

    const employee = await Employee.findOne({
        userId: session.userId,
    });

    if (!employee) {
        const error = new Error("Employee not found");
        error.statusCode = 404;
        throw error;
    }

    if (employee.isDeleted) {
        const error = new Error(
            "Your account is deactivated, you cannot clock in/out"
        );
        error.statusCode = 403;
        throw error;
    }

    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let shift = null;
    try {
        const assignment = await (await import("../models/shiftAssignmentModel.js")).default.findOne({
            employeeId: employee._id,
            date: { $gte: todayStart, $lte: todayEnd },
        }).populate("shiftId");
        if (assignment && assignment.shiftId) {
            shift = assignment.shiftId;
        }
    } catch {}

    let existing = await Attendance.findOne({
        employeeId: employee._id,
        date: { $gte: todayStart, $lte: todayEnd },
    });

    if (existing) {
        if (!existing.checkOut) {
            existing.checkOut = now;
            const checkInTime = new Date(existing.checkIn).getTime();
            const diffMs = now.getTime() - checkInTime;
            const diffHours = diffMs / (1000 * 60 * 60);
            const workingHours = parseFloat(diffHours.toFixed(2));

            let dayType = "Half Day";
            if (workingHours >= 8) {
                dayType = "Full Day";
            }

            let overtimeMinutes = 0;

            if (shift) {
                const [endHour, endMinute] = shift.endTime.split(":").map(Number);
                const shiftEnd = new Date(now);
                shiftEnd.setHours(endHour, endMinute, 0, 0);
                if (now > shiftEnd) {
                    overtimeMinutes = Math.floor((now.getTime() - shiftEnd.getTime()) / (1000 * 60));
                }
            }

            existing.workingHours = workingHours;
            existing.dayType = dayType;
            existing.overtimeMinutes = overtimeMinutes;

            await existing.save();

            return {
                success: true,
                type: "CHECK_OUT",
                data: existing,
            };
        }

        return {
            success: true,
            type: "ALREADY_CHECKED_OUT",
            data: existing,
        };
    }

    let status = "PRESENT";
    let lateMinutes = 0;

    if (shift) {
        const [startHour, startMinute] = shift.startTime.split(":").map(Number);
        const shiftStart = new Date(now);
        shiftStart.setHours(startHour, startMinute, 0, 0);
        const graceEnd = new Date(shiftStart.getTime() + shift.graceMinutes * 60 * 1000);

        if (now > graceEnd) {
            status = "LATE";
            lateMinutes = Math.floor((now.getTime() - graceEnd.getTime()) / (1000 * 60));
        }
    }

    try {
        existing = await Attendance.create({
            employeeId: employee._id,
            shiftId: shift?._id || null,
            date: todayStart,
            checkIn: now,
            status,
            lateMinutes,
            overtimeMinutes: 0
        });
    } catch (err) {
        if (err.code === 11000) {
            existing = await Attendance.findOne({
                employeeId: employee._id,
                date: { $gte: todayStart, $lte: todayEnd },
            });
            if (existing && !existing.checkOut) {
                existing.checkOut = now;
                const checkInTime = new Date(existing.checkIn).getTime();
                const diffMs = now.getTime() - checkInTime;
                const diffHours = diffMs / (1000 * 60 * 60);
                const workingHours = parseFloat(diffHours.toFixed(2));
                let dayType = "Half Day";
                if (workingHours >= 8) dayType = "Full Day";
                let overtimeMinutes = 0;
                if (shift) {
                    const [endHour, endMinute] = shift.endTime.split(":").map(Number);
                    const shiftEnd = new Date(now);
                    shiftEnd.setHours(endHour, endMinute, 0, 0);
                    if (now > shiftEnd) overtimeMinutes = Math.floor((now.getTime() - shiftEnd.getTime()) / (1000 * 60));
                }
                existing.workingHours = workingHours;
                existing.dayType = dayType;
                existing.overtimeMinutes = overtimeMinutes;
                await existing.save();
                return { success: true, type: "CHECK_OUT", data: existing };
            }
            if (existing) {
                return { success: true, type: "ALREADY_CHECKED_OUT", data: existing };
            }
            const error = new Error("Clock in failed, please try again");
            error.statusCode = 500;
            throw error;
        }
        throw err;
    }

    return {
        success: true,
        type: "CHECK_IN",
        data: existing,
    };
};


const toLocalDateString = (date) => {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};


const buildMonthAttendance = async (employeeId, startDate, endDate, joiningDate) => {
    const shifts = await ShiftAssignment.find({
        employeeId,
        date: { $gte: startDate, $lte: endDate }
    }).populate("shiftId").lean();

    const shiftMap = {};
    shifts.forEach(s => {
        shiftMap[toLocalDateString(s.date)] = s;
    });

    const records = await Attendance.find({
        employeeId,
        date: { $gte: startDate, $lte: endDate }
    }).lean();

    const recordMap = {};
    records.forEach(r => {
        recordMap[toLocalDateString(r.date)] = r;
    });

    let holidays = [];
    try {
        holidays = await PublicHoliday.find({
            startDate: { $lte: endDate },
            endDate: { $gte: startDate }
        }).lean();
    } catch {}

    const holidaySet = new Set();
    holidays.forEach(h => {
        const s = new Date(h.startDate);
        const e = new Date(h.endDate);
        s.setHours(0, 0, 0, 0);
        e.setHours(23, 59, 59, 999);
        const cur = new Date(s);
        while (cur <= e) {
            holidaySet.add(toLocalDateString(cur));
            cur.setDate(cur.getDate() + 1);
        }
    });

    const empJoining = joiningDate ? new Date(joiningDate) : null;
    if (empJoining) empJoining.setHours(0, 0, 0, 0);

    const result = [];
    const current = new Date(startDate);

    while (current <= endDate) {
        const dateKey = toLocalDateString(current);
        const dayOfWeek = current.getDay();

        if (empJoining && current < empJoining) {
            current.setDate(current.getDate() + 1);
            continue;
        }

        if (holidaySet.has(dateKey)) {
            current.setDate(current.getDate() + 1);
            continue;
        }

        const existing = recordMap[dateKey];
        if (existing) {
            result.push(existing);
            current.setDate(current.getDate() + 1);
            continue;
        }

        const shiftAssignment = shiftMap[dateKey];
        if (shiftAssignment && shiftAssignment.shiftId) {
            const shift = shiftAssignment.shiftId;
            if (shift.weekends && shift.weekends.includes(dayOfWeek)) {
                result.push({
                    _id: `weekend-${dateKey}`,
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

        if (shiftAssignment && shiftAssignment.shiftId) {
            result.push({
                _id: `absent-${dateKey}`,
                employeeId,
                date: new Date(current),
                status: "ABSENT",
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


export const getAttendance = async (session, query) => {

    const employee = await Employee.findOne({
        userId: session.userId,
    });

    if (!employee) {
        const error = new Error("Employee not found");
        error.statusCode = 404;
        throw error;
    }

    const month = parseInt(query.month) || (new Date().getMonth() + 1);
    const year = parseInt(query.year) || new Date().getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const data = await buildMonthAttendance(employee._id, startDate, endDate, employee.joiningDate);

    return {
        data,
        employee: { isDeleted: employee.isDeleted },
    };
};


export const getAdminAttendance = async (query) => {
    const { month, year, department, employeeId } = query;

    const m = parseInt(month) || (new Date().getMonth() + 1);
    const y = parseInt(year) || new Date().getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59, 999);

    const empFilter = { isDeleted: { $ne: true } };
    if (department) empFilter.department = department;
    if (employeeId) empFilter._id = employeeId;

    const employees = await Employee.find(empFilter).select('firstName lastName department position joiningDate');

    const allAttendance = [];

    for (const emp of employees) {
        const empData = await buildMonthAttendance(emp._id, startDate, endDate, emp.joiningDate);
        empData.forEach(record => {
            record.employeeId = {
                _id: emp._id,
                firstName: emp.firstName,
                lastName: emp.lastName,
                department: emp.department,
                position: emp.position,
            };
        });
        allAttendance.push(...empData);
    }

    allAttendance.sort((a, b) => new Date(b.date) - new Date(a.date));

    const presentDays = allAttendance.filter(a => a.status === 'PRESENT').length;
    const lateDays = allAttendance.filter(a => a.status === 'LATE').length;
    const absentDays = allAttendance.filter(a => a.status === 'ABSENT').length;
    const totalWorkingHours = allAttendance.reduce((sum, a) => sum + (a.workingHours || 0), 0);
    const workDaysCount = allAttendance.filter(a => a.workingHours).length;
    const avgHours = workDaysCount > 0 ? (totalWorkingHours / workDaysCount).toFixed(1) : '0';

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
