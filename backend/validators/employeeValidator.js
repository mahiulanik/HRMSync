import { body, param } from "express-validator";
import { DEPARTMENTS } from "../constants/departments.js";


export const createEmployeeValidation = [
    body("firstName")
        .trim()
        .notEmpty()
        .withMessage("First name is required"),

    body("lastName")
        .optional({ values: "falsy" })
        .trim(),

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
        .optional({ values: "falsy" })
        .trim(),

    body("position")
        .trim()
        .notEmpty()
        .withMessage("Position is required"),

    body("department")
        .optional({ values: "falsy" })
        .isIn(DEPARTMENTS)
        .withMessage("Invalid department"),

    body("grossSalary")
        .optional({ values: "falsy" })
        .isFloat({ min: 0 })
        .withMessage("Gross salary must be a non-negative number"),

    body("basicSalary")
        .optional({ values: "falsy" })
        .isFloat({ min: 0 })
        .withMessage("Basic salary must be a non-negative number"),

    body("houseRent")
        .optional({ values: "falsy" })
        .isFloat({ min: 0 })
        .withMessage("House rent must be a non-negative number"),

    body("medical")
        .optional({ values: "falsy" })
        .isFloat({ min: 0 })
        .withMessage("Medical allowance must be a non-negative number"),

    body("conveyance")
        .optional({ values: "falsy" })
        .isFloat({ min: 0 })
        .withMessage("Conveyance must be a non-negative number"),

    body("allowances")
        .optional({ values: "falsy" })
        .isFloat({ min: 0 })
        .withMessage("Allowances must be a non-negative number"),

    body("deductions")
        .optional({ values: "falsy" })
        .isFloat({ min: 0 })
        .withMessage("Deductions must be a non-negative number"),

    body("employeeStatus")
        .optional()
        .isIn(["Active", "Inactive"])
        .withMessage("Invalid employee status"),

    body("joiningDate")
        .optional()
        .isISO8601()
        .withMessage("Joining date must be a valid date"),

    body("bio")
        .optional({ values: "falsy" })
        .trim(),

    body("profilePic")
        .optional({ values: "falsy" }),

];

export const updateEmployeeValidation = [

    body("firstName")
        .optional({ values: "falsy" })
        .trim(),

    body("lastName")
        .optional({ values: "falsy" })
        .trim(),

    body("email")
        .optional({ values: "falsy" })
        .trim()
        .isEmail()
        .withMessage("Please provide a valid email"),

    body("password")
        .optional({ values: "falsy" })
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),

    body("mobile")
        .optional({ values: "falsy" })
        .trim(),

    body("position")
        .optional({ values: "falsy" })
        .trim(),

    body("department")
        .optional({ values: "falsy" })
        .isIn(DEPARTMENTS)
        .withMessage("Invalid department"),

    body("grossSalary")
        .optional({ values: "falsy" })
        .isFloat({ min: 0 })
        .withMessage("Gross salary must be a non-negative number"),

    body("basicSalary")
        .optional({ values: "falsy" })
        .isFloat({ min: 0 })
        .withMessage("Basic salary must be a non-negative number"),

    body("houseRent")
        .optional({ values: "falsy" })
        .isFloat({ min: 0 })
        .withMessage("House rent must be a non-negative number"),

    body("medical")
        .optional({ values: "falsy" })
        .isFloat({ min: 0 })
        .withMessage("Medical allowance must be a non-negative number"),

    body("conveyance")
        .optional({ values: "falsy" })
        .isFloat({ min: 0 })
        .withMessage("Conveyance must be a non-negative number"),

    body("allowances")
        .optional({ values: "falsy" })
        .isFloat({ min: 0 })
        .withMessage("Allowances must be a non-negative number"),

    body("deductions")
        .optional({ values: "falsy" })
        .isFloat({ min: 0 })
        .withMessage("Deductions must be a non-negative number"),

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
        .optional({ values: "falsy" })
        .trim(),

    body("profilePic")
        .optional({ values: "falsy" }),

];

export const employeeIdValidation = [
    param("id")
        .isMongoId()
        .withMessage("Invalid employee ID"),
];