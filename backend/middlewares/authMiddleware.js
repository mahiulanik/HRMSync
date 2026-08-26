import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";


export const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next(
                new AppError("Unauthorized", 401)
            );
        }

        const token = authHeader.split(" ")[1];

        req.session = jwt.verify(
            token,
            process.env.JWT_SECRET,
            {
                algorithms: ["HS256"]
            }
        );

        next();

    } catch (error) {
        return next(
            new AppError("Unauthorized", 401)
        );
    }
};


export const requiredAdmin = (req, res, next) => {

    if (req?.session?.role !== "ADMIN") {
        return next(
            new AppError("Admin access required", 403)
        );
    }

    next();
};