import { query } from "express-validator";


export const attendanceQueryValidation = [
    query("month")
        .optional()
        .isInt({ min: 1, max: 12 })
        .withMessage("Month must be between 1 and 12"),

    query("year")
        .optional()
        .isInt({ min: 2000, max: 2100 })
        .withMessage("Year must be between 2000 and 2100"),
];

export const adminAttendanceQueryValidation = [
    ...attendanceQueryValidation,

    query("department")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Department cannot be empty"),

    query("employeeId")
        .optional()
        .isMongoId()
        .withMessage("Invalid employee ID"),
];