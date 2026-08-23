import { body, param, query } from "express-validator";


export const generatePayrollValidation = [
    body("month")
        .notEmpty()
        .withMessage("Month is required")
        .isInt({ min: 1, max: 12 })
        .withMessage("Month must be between 1 and 12"),

    body("year")
        .notEmpty()
        .withMessage("Year is required")
        .isInt({ min: 2000, max: 2100 })
        .withMessage("Year must be between 2000 and 2100"),
];


export const companyPayrollValidation = [
    query("month")
        .notEmpty()
        .withMessage("Month is required")
        .isInt({ min: 1, max: 12 })
        .withMessage("Month must be between 1 and 12"),

    query("year")
        .notEmpty()
        .withMessage("Year is required")
        .isInt({ min: 2000, max: 2100 })
        .withMessage("Year must be between 2000 and 2100"),
];


export const departmentPayrollValidation = [
    param("department")
        .trim()
        .notEmpty()
        .withMessage("Department is required"),

    query("month")
        .notEmpty()
        .withMessage("Month is required")
        .isInt({ min: 1, max: 12 })
        .withMessage("Month must be between 1 and 12"),

    query("year")
        .notEmpty()
        .withMessage("Year is required")
        .isInt({ min: 2000, max: 2100 })
        .withMessage("Year must be between 2000 and 2100"),
];


export const employeePayrollValidation = [
    param("employeeId")
        .isMongoId()
        .withMessage("Invalid employee ID"),

    query("month")
        .notEmpty()
        .withMessage("Month is required")
        .isInt({ min: 1, max: 12 })
        .withMessage("Month must be between 1 and 12"),

    query("year")
        .notEmpty()
        .withMessage("Year is required")
        .isInt({ min: 2000, max: 2100 })
        .withMessage("Year must be between 2000 and 2100"),
];