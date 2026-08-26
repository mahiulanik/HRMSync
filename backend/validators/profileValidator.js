import { body } from "express-validator";

export const updateProfileValidation = [
    body("bio")
        .optional()
        .trim(),

    body("firstName")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("First name cannot be empty"),

    body("lastName")
        .optional()
        .trim(),

    body("email")
        .optional()
        .trim()
        .isEmail()
        .withMessage("Invalid email address")
        .normalizeEmail(),

    body("mobile")
        .optional()
        .trim(),

    body("position")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Position cannot be empty"),

    body("grossSalary")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Gross salary must be a valid positive number"),

    body("basicSalary")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Basic salary must be a valid positive number"),

    body("houseRent")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("House rent must be a valid positive number"),

    body("medical")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Medical allowance must be a valid positive number"),

    body("conveyance")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Conveyance must be a valid positive number"),

    body("allowances")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Allowances must be a valid positive number"),

    body("deductions")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Deductions must be a valid positive number"),

    body("employeeStatus")
        .optional()
        .isIn(["Active", "Inactive"])
        .withMessage("Invalid employee status"),

    body("joiningDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid joining date"),

    body("department")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Department cannot be empty"),
];