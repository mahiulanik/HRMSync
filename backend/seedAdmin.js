import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import User from "./models/userModel.js";
import bcrypt from "bcrypt";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD


async function registerAdmin() {
    try {
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL

        if(!ADMIN_EMAIL) {
            console.error("Missing ADMIN_EMAIL env variable")
            process.exit(1)
        }

        await connectDB()

        const existingAdmin = await User.findOne({email: ADMIN_EMAIL})

        if(existingAdmin) {
            console.log("User already exists as role", existingAdmin.role)
            await mongoose.disconnect()
            process.exit(0)
        }

        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10)

        const admin = await User.create({
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: "ADMIN"
        })

        console.log("Admin user created successfully.");

    } catch (error) {
        console.error("Seed Failed", error)
    } finally {
        await mongoose.disconnect();
    }
}

registerAdmin()

