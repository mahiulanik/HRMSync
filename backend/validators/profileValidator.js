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
        .trim(),

    body("department")
        .optional()
        .trim(),
];