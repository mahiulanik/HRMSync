import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema({
        month: {type: Number, required: true, min: 1, max: 12},
        year: {type: Number, required: true},
        totalEmployees: {type: Number, default: 0},
        totalGrossSalary: {type: Number, default: 0},
        totalDeductions: {type: Number, default: 0},
        totalNetSalary: {type: Number, default: 0},
        status: {type: String, enum: ["DRAFT", "PROCESSED", "PAID"], default: "DRAFT"},
        processedAt: {type: Date, default: null}
    },{timestamps: true}
);

payrollSchema.index({month: 1, year: 1}, {unique: true});

const Payroll = mongoose.models.Payroll || mongoose.model("Payroll", payrollSchema);

export default Payroll;