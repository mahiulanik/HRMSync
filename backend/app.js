import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import cors from "cors"
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import "dotenv/config";
import router from "./routes/api.js"
import connectDB from "./config/db.js";
import { globalLimiter } from "./middlewares/rateLimiter.js";

const app = express()

// Global Middlewares
app.use(helmet())
app.use(hpp())
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(express.json({limit: "10mb"}))
app.use(express.urlencoded({extended: true, limit: "10mb"}))
app.use(cookieParser());
app.use(globalLimiter);

// WEB CACHE
app.set("etag", false)

// API Routes
app.use("/api", router)

const PORT = process.env.PORT || 3000
await connectDB()
app.listen(PORT, ()=> console.log(`Server is running on ${PORT}`))
