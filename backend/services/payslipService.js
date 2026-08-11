import mongoose from "mongoose";
import Employee from "../models/employeeModel.js"
import Payslip from "../models/payslipModel.js"
import AppError from "../utils/AppError.js";


export const createPayslip = async (payslipData) => {
    const {employeeId, month, year, grossSalary, allowances, deductions} = payslipData

    if (!employeeId || !month || !year || !grossSalary) {
        throw new AppError("Missing required fields", 400);
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
        throw new AppError("Employee not found", 404);
    }

    const gross = Number(grossSalary);
    const allowance = Number(allowances || 0);
    const deduction = Number(deductions || 0);
    const basic = Math.round(gross * 0.5);
    const houseRent = Math.round(gross * 0.25);
    const medical = Math.round(gross * 0.125);
    const conveyance = Math.round(gross * 0.125);

    const netSalary = gross + allowance - deduction;

    const existingPayslip = await Payslip.findOne({
        employeeId,
        month: Number(month),
        year: Number(year)
    });

    if (existingPayslip) {
        throw new AppError(
            "Payslip already exists for this employee and month",
            409
        );
    }

    const payslip = await Payslip.create({
        employeeId,
        month: Number(month),
        year: Number(year),
        grossSalary: gross,
        basicSalary: basic,
        houseRent,
        medical,
        conveyance,
        allowances: allowance,
        deductions: deduction,
        netSalary
    });

    return {
        success: true,
        data: payslip
    };
};


export const getPayslips = async (session) => {
    const isAdmin = session.role === "ADMIN";

    if (isAdmin) {
        const payslips = await Payslip.find()
            .populate("employeeId")
            .sort({ createdAt: -1 });

        const data = payslips.map((payslip) => {
            const obj = payslip.toObject();
            return {
                ...obj,
                id: obj._id.toString(),
                employee: obj.employeeId,
                employeeId: obj.employeeId?._id?.toString()
            };
        });

        return { data };
    }

    const employee = await Employee.findOne({
        userId: session.userId
    }).lean();

    if (!employee) {
        throw new AppError("Employee not found", 404);
    }

    const payslips = await Payslip.find({
        employeeId: employee._id
    }).sort({ createdAt: -1 });

    return {
        success: true,
        data: payslips
    };
};


export const getPayslipById = async (id, session) => {

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid payslip ID", 400);
    }

    const payslip = await Payslip.findById(id)
        .populate("employeeId")
        .lean();

    if (!payslip) {
        throw new AppError("Payslip not found", 404);
    }

    // ADMIN can access any payslip
    if (session.role === "ADMIN") {
        return {
            success: true,
            data: {
                ...payslip,
                id: payslip._id.toString(),
                employee: payslip.employeeId
            }
        };
    }

    // Employee can only access own payslip
    const employee = await Employee.findOne({
        userId: session.userId,
        isDeleted: false
    }).lean();

    if (!employee) {
        throw new AppError("Employee not found", 404);
    }

    if (
        payslip.employeeId?._id?.toString() !==
        employee._id.toString()
    ) {
        throw new AppError("You are not authorized to access this payslip", 403);
    }

    return {
        success: true,
        data: {
            ...payslip,
            id: payslip._id.toString(),
            employee: payslip.employeeId
        }
    };
};