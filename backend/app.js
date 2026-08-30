import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes/api.js";
import { globalLimiter } from "./middlewares/rateLimiter.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";


const app = express();


// Global Middlewares
app.use(helmet());
app.use(hpp());

// HTTPS enforcement in production
if (process.env.NODE_ENV === "production") {
    app.use((req, res, next) => {
        if (req.headers["x-forwarded-proto"] !== "https") {
            return res.redirect(301, `https://${req.headers.host}${req.url}`);
        }
        next();
    });
}

const allowedOrigins = [
    "http://localhost:5173",
    "https://hrmsync.vercel.app"
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(globalLimiter);

// WEB CACHE
app.set("etag", false);


// API Routes
app.use("/api", router);


// Error Middleware
app.use(errorMiddleware);


export default app;
