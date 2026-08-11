import rateLimit from "express-rate-limit";


export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many request from this IP, please try again later"
})


export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {error: "Too many attempts, please try again after 15 minutes"},
    standardHeaders: true,
    legacyHeaders: false
})