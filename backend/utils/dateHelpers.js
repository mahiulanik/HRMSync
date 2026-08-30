// ─── Asia/Dhaka Timezone Helpers (shared across services) ───
export const UTC_OFFSET = 6;
export const WEEKEND_DAYS = [5, 6]; // Friday (5) & Saturday (6)

export const nowInDhaka = () => {
    const utc = Date.now() + new Date().getTimezoneOffset() * 60000;
    return new Date(utc + UTC_OFFSET * 3600000);
};

export const toDateKey = (date) => {
    const d = new Date(date);
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    const local = new Date(utc + UTC_OFFSET * 3600000);
    return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
};

export const startOfDayDhaka = (daysAgo = 0) => {
    const now = nowInDhaka();
    const result = new Date(now);
    result.setHours(0, 0, 0, 0);
    result.setDate(result.getDate() - daysAgo);
    return result;
};

export const endOfDayDhaka = () => {
    const now = nowInDhaka();
    const result = new Date(now);
    result.setHours(23, 59, 59, 999);
    return result;
};

export const startOfMonthDhaka = (yearOrMonthsBack, month) => {
    if (month !== undefined) {
        return new Date(yearOrMonthsBack, month - 1, 1);
    }
    const now = nowInDhaka();
    return new Date(now.getFullYear(), now.getMonth() - yearOrMonthsBack, 1);
};

export const endOfMonthDhaka = (year, month) => {
    if (year !== undefined && month !== undefined) {
        return new Date(year, month, 0, 23, 59, 59, 999);
    }
    const now = nowInDhaka();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
};

export const startOfYearDhaka = () => {
    const now = nowInDhaka();
    return new Date(now.getFullYear(), 0, 1);
};

export const endOfYearDhaka = () => {
    const now = nowInDhaka();
    return new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
};

export const isWeekendDate = (date) => WEEKEND_DAYS.includes(date.getDay());

/** Check if a date string (YYYY-MM-DD) falls on a weekend */
export const isWeekendByDateStr = (dateStr) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return WEEKEND_DAYS.includes(new Date(y, m - 1, d).getDay());
};

// ─── Regex Escape (prevents ReDoS) ───────────────────────────
export const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
