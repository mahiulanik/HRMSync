import jwt from "jsonwebtoken";

// Generate Access Token
export const generateAccessToken = (email, userId, role) => {
    return jwt.sign(
        {
            email,
            userId,
            role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "15m",
            algorithm: "HS256"
        }
    );
};

// Generate Refresh Token
export const generateRefreshToken = (email, userId, role) => {
    return jwt.sign(
        {
            email,
            userId,
            role
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: "7d",
            algorithm: "HS256"
        }
    );
};

// Verify Access Token
export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// Verify Refresh Token
export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        return null;
    }
};