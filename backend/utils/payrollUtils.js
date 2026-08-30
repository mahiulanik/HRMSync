import { WEEKEND_DAYS, OVERTIME_MULTIPLIER } from "../constants/payroll.js";

// ─── Exported Helpers ─────────────────────────────────────────

export const getMonthDateRange = (month, year) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    return { startDate, endDate };
};

export const getWorkingDaysInMonth = (month, year) => {
    const totalDays = new Date(year, month, 0).getDate();
    const workingDates = [];

    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();

        if (!WEEKEND_DAYS.includes(dayOfWeek)) {
            date.setHours(0, 0, 0, 0);
            workingDates.push(date);
        }
    }

    return workingDates;
};

export const normalizeDate = (date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
};

export const roundMoney = (amount) => {
    return Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
};

export const calculateOvertimeAmount = ({ overtimeMinutes, basicSalary, workingDays, shiftHours = 8 }) => {
    if (!overtimeMinutes || overtimeMinutes <= 0 || !workingDays || !basicSalary) {
        return 0;
    }

    const dailySalary = basicSalary / workingDays;
    const hourlySalary = dailySalary / shiftHours;
    const overtimeHours = overtimeMinutes / 60;

    return roundMoney(hourlySalary * overtimeHours * OVERTIME_MULTIPLIER);
};
