import Attendance from "../models/attendanceModel.js"
import Employee from "../models/employeeModel.js"
import ShiftAssignment from "../models/shiftAssignmentModel.js"
import PublicHoliday from "../models/publicHolidayModel.js"
import Leave from "../models/leaveModel.js";
import AppError from "../utils/AppError.js";



export const clockInOut = async (session) => {

    const employee = await Employee.findOne({
        userId: session.userId,
    });
    
    if (!employee) {
        throw new AppError("Employee not found", 404);
    }

    if (employee.isDeleted) {
        throw new AppError("Your account is deactivated, you cannot clock in/out", 403);
    }

    const now = new Date();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let shift = null;

    try {
        const assignment =
            await ShiftAssignment.findOne({
                employeeId: employee._id,
                date: {
                    $gte: todayStart,
                    $lte: todayEnd,
                },
            }).populate("shiftId");

        if (assignment?.shiftId) {
            shift = assignment.shiftId;
        }
    } catch {
        // Shift assignment failure should not stop clock in/out
    }

    let existing = await Attendance.findOne({
        employeeId: employee._id,
        date: {
            $gte: todayStart,
            $lte: todayEnd,
        },
    });

    // CHECK OUT
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
                const [endHour, endMinute] =  shift.endTime.split(":").map(Number);
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

    // CHECK IN
    let status = "PRESENT";
    let lateMinutes = 0;

    // Company weekend: Friday (5) & Saturday (6)
    const isWeekend = now.getDay() === 5 || now.getDay() === 6;

    if (isWeekend) {
        status = "WEEKEND";
    } else if (shift) {

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
            overtimeMinutes: 0,
        });

    } catch (err) {

        // Concurrent clock-in
        if (err.code === 11000) {
            existing = await Attendance.findOne({
                employeeId: employee._id,
                date: {
                    $gte: todayStart,
                    $lte: todayEnd,
                },
            });

            if (existing && !existing.checkOut) {

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

            if (existing) {
                return {
                    success: true,
                    type: "ALREADY_CHECKED_OUT",
                    data: existing,
                };
            }
            throw new AppError("Clock in failed, please try again", 500);
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

    const approvedLeaves = await Leave.find({
        employeeId,
        status: "APPROVED",
        startDate: { $lte: endDate },
        endDate: { $gte: startDate }
    }).lean();

    const recordMap = {};
    records.forEach(r => {
        recordMap[toLocalDateString(r.date)] = r;
    });

    const leaveMap = {};

    approvedLeaves.forEach(leave => {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);

        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        const current = new Date(start);

        while (current <= end) {
            leaveMap[toLocalDateString(current)] = leave;
            current.setDate(current.getDate() + 1);
        }
    });

    let holidays = [];

    try {
        holidays = await PublicHoliday.find({
            startDate: { $lte: endDate },
            endDate: { $gte: startDate }
        }).lean();
    } catch {}

    const holidayMap = {};

    holidays.forEach(h => {
        const s = new Date(h.startDate);
        const e = new Date(h.endDate);

        s.setHours(0, 0, 0, 0);
        e.setHours(23, 59, 59, 999);

        const cur = new Date(s);

        while (cur <= e) {
            holidayMap[toLocalDateString(cur)] = h;
            cur.setDate(cur.getDate() + 1);
        }
    });

    const empJoining = joiningDate ? new Date(joiningDate) : null;

    if (empJoining) {
        empJoining.setHours(0, 0, 0, 0);
    }

    const result = [];
const current = new Date(startDate);

while (current <= endDate) {
    const dateKey = toLocalDateString(current);
    const dayOfWeek = current.getDay();

    if (empJoining && current < empJoining) {
        current.setDate(current.getDate() + 1);
        continue;
    }

    const existing = recordMap[dateKey];
    const approvedLeave = leaveMap[dateKey];
    const holiday = holidayMap[dateKey];

    // 1. HOLIDAY HAS HIGHEST PRIORITY

    if (holiday) {
        result.push({
            ...(existing || {}),
            _id: existing?._id || `holiday-${employeeId}-${dateKey}`,
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
        if (
            approvedLeave &&
            existing.status === "ABSENT"
        ) {
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

    // 3. WEEKEND

    const shiftAssignment = shiftMap[dateKey];

    if (shiftAssignment && shiftAssignment.shiftId) {
        const shift = shiftAssignment.shiftId;

        if (shift.weekends && shift.weekends.includes(dayOfWeek)) {
            result.push({
                _id: `weekend-${employeeId}-${dateKey}`,
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

    if (shiftAssignment && shiftAssignment.shiftId) {
        result.push({
            _id: `absent-${employeeId}-${dateKey}`,
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

    result.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
    );

    return result;
};



export const getAttendance = async (session, query) => {

    const employee = await Employee.findOne({
        userId: session.userId,
    });

    if (!employee) {
        throw new AppError("Employee not found", 404);
    }

    const month = parseInt(query.month) || (new Date().getMonth() + 1);
    const year = parseInt(query.year) || new Date().getFullYear();

    const startDate = new Date(year, month - 1, 1);
    let endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (year === today.getFullYear() && month === today.getMonth() + 1) {
        endDate = today;
    }

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

    const presentDays = allAttendance.filter(a =>
        ['PRESENT', 'LATE', 'WEEKEND', 'SICK', 'CASUAL', 'EARNED', 'HOLIDAY'].includes(a.status)
        ).length;

    const lateDays = allAttendance.filter(
        a => a.status === 'LATE'
        ).length;

    const absentDays = allAttendance.filter(
        a => a.status === 'ABSENT'
        ).length;

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
