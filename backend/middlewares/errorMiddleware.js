export const errorMiddleware = (err, req, res, next) => {
    // Only log unexpected errors (500s), not operational/client errors
    if (!err.statusCode || err.statusCode >= 500) {
        console.error(err);
    }

    const statusCode = err.statusCode || 500;

    return res.status(statusCode).json({
        success: false,
        message:
            statusCode === 500
                ? "Internal Server Error"
                : err.message,
        ...(err.errors && { errors: err.errors })
    });
};