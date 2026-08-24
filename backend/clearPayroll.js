import mongoose from "mongoose";
import dotenv from "dotenv";
import Payroll from "./models/payrollModel.js";
import Payslip from "./models/payslipModel.js";

dotenv.config();

const clearPayroll = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        await Payslip.deleteMany({
            month: 8,
            year: 2026
        });

        await Payroll.deleteMany({
            month: 8,
            year: 2026
        });

        console.log("August 2026 payroll and payslips deleted");

        await mongoose.disconnect();

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

clearPayroll();