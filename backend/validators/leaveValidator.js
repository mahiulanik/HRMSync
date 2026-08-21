import { body, query, param } from "express-validator";

export const createLeaveValidation = [
    body("type")
        .trim()
        .notEmpty()
        .withMessage("Leave type is required"),

    body("startDate")
        .notEmpty()
        .withMessage("Start date is required")
        .isISO8601()
        .withMessage("Start date must be a valid date"),

    body("endDate")
        .notEmpty()
        .withMessage("End date is required")
        .isISO8601()
        .withMessage("End date must be a valid date")
        .custom((value, { req }) => {
            const start = new Date(req.body.startDate);
            const end = new Date(value);

            if (end < start) {
                throw new Error("End date cannot be before start date");
            }

            return true;
        }),

    body("reason")
        .trim()
        .notEmpty()
        .withMessage("Leave reason is required"),
];

export const getLeavesValidation = [
    query("status")
        .optional()
        .isIn(["PENDING", "APPROVED", "REJECTED"])
        .withMessage("Invalid leave status"),

    query("month")
        .optional()
        .isInt({ min: 1, max: 12 })
        .withMessage("Month must be between 1 and 12"),

    query("year")
        .optional()
        .isInt({ min: 2000, max: 2100 })
        .withMessage("Year must be between 2000 and 2100"),
];

export const updateLeaveValidation = [
    param("id")
        .isMongoId()
        .withMessage("Invalid leave ID"),

    body("status")
        .notEmpty()
        .withMessage("Status is required")
        .isIn(["APPROVED", "REJECTED", "PENDING"])
        .withMessage("Invalid leave status"),
];