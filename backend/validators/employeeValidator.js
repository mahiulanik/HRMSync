import { body } from "express-validator";
import { param } from "express-validator";



export const createEmployeeValidation = [
    body("firstName")
        .trim()
        .notEmpty()
        .withMessage("First name is required"),

    body("lastName")
        .trim()
        .notEmpty()
        .withMessage("Last name is required"),

    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please provide a valid email"),

    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),

    body("mobile")
        .optional()
        .trim()
        .isMobilePhone()
        .withMessage("Please provide a valid phone number"),
];


export const updateEmployeeValidation = [
    body("email")
        .optional()
        .trim()
        .isEmail()
        .withMessage("Please provide a valid email"),

    body("firstName")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("First name cannot be empty"),

    body("lastName")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Last name cannot be empty"),

    body("password")
        .optional()
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),

    body("mobile")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Mobile number cannot be empty"),

    body("grossSalary")
        .optional()
        .isNumeric()
        .withMessage("Gross salary must be a number")
        .custom((value) => {
            if (Number(value) < 0) {
                throw new Error("Gross salary cannot be negative");
            }
            return true;
        }),

    body("allowances")
        .optional()
        .isNumeric()
        .withMessage("Allowances must be a number")
        .custom((value) => {
            if (Number(value) < 0) {
                throw new Error("Allowances cannot be negative");
            }
            return true;
        }),

    body("deductions")
        .optional()
        .isNumeric()
        .withMessage("Deductions must be a number")
        .custom((value) => {
            if (Number(value) < 0) {
                throw new Error("Deductions cannot be negative");
            }
            return true;
        }),

    body("employeeStatus")
        .optional()
        .isIn(["Active", "Inactive"])
        .withMessage("Invalid employee status"),

    body("joiningDate")
        .optional()
        .isISO8601()
        .withMessage("Joining date must be a valid date"),

    body("isDeleted")
        .optional()
        .isBoolean()
        .withMessage("isDeleted must be a boolean"),

    body("bio")
        .optional()
        .trim(),

    body("department")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Department cannot be empty"),

    body("position")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Position cannot be empty"),

    body("role")
        .optional()
        .isIn(["ADMIN", "EMPLOYEE"])
        .withMessage("Invalid role"),
];

export const employeeIdValidation = [
    param("id")
        .isMongoId()
        .withMessage("Invalid employee ID"),
];