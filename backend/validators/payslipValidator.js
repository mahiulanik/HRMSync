import { body, param } from "express-validator";

export const createPayslipValidation = [
    body("employeeId")
        .notEmpty()
        .withMessage("Employee ID is required")
        .isMongoId()
        .withMessage("Invalid employee ID"),

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

    body("grossSalary")
        .notEmpty()
        .withMessage("Gross salary is required")
        .isFloat({ min: 0 })
        .withMessage("Gross salary must be a valid positive number"),

    body("allowances")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Allowances must be a valid positive number"),

    body("deductions")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Deductions must be a valid positive number"),
];


export const updatePayslipValidation = [
    param("id")
        .isMongoId()
        .withMessage("Invalid payslip ID"),

    body("grossSalary")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Gross salary must be a valid positive number"),

    body("allowances")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Allowances must be a valid positive number"),

    body("deductions")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Deductions must be a valid positive number"),
];

export const payslipIdValidation = [
    param("id")
        .isMongoId()
        .withMessage("Invalid payslip ID"),
];

