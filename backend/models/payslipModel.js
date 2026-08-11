import mongoose from "mongoose";

const payslipSchema = new mongoose.Schema({
    payrollId: {type: mongoose.Schema.Types.ObjectId,ref: "Payroll",required: false},
    employeeId: {type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true},
    month: {type: Number, required: true},
    year: {type: Number, required: true},
    basicSalary: {type: Number, required: true},
    grossSalary: {type: Number, default: 0},
    houseRent: {type: Number, default: 0},
    medical: {type: Number, default: 0},
    conveyance: {type: Number, default: 0},
    allowances: {type: Number, default: 0},
    overtimeAmount: {type: Number,default: 0},
    unpaidLeaveDeduction: {type: Number,default: 0},
    otherDeductions: {type: Number,default: 0},
    totalDeductions: {type: Number,default: 0},
    netSalary: {type: Number,default: 0},
    workingDays: {type: Number,default: 0},
    presentDays: {type: Number,default: 0},
    paidLeaveDays: {type: Number,default: 0},
    unpaidLeaveDays: {type: Number,default: 0}
    },{timestamps: true}
);

payslipSchema.index({employeeId: 1,month: 1,year: 1},{unique: true});

const Payslip = mongoose.models.Payslip || mongoose.model("Payslip", payslipSchema);

export default Payslip;