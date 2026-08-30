import mongoose from "mongoose";
import Employee from "../models/employeeModel.js"
import Payslip from "../models/payslipModel.js"
import AppError from "../utils/AppError.js";
import { escapeRegex } from "../utils/dateHelpers.js";


export const createPayslip = async (payslipData) => {
    const {employeeId, month, year, grossSalary, allowances, deductions} = payslipData

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
        throw new AppError("Payslip already exists for this employee and month", 409);
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


export const getPayslips = async (session, page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc') => {
    const isAdmin = session.role === "ADMIN";

    if (isAdmin) {
         const where = {};

        if (search) {
            const safe = escapeRegex(search);
            const employees = await Employee.find({
                $or: [
                    { firstName: { $regex: safe, $options: 'i' } },
                    { lastName: { $regex: safe, $options: 'i' } },
                    { email: { $regex: safe, $options: 'i' } },
                ]
            }).select('_id').lean();

            const employeeIds = employees.map(e => e._id);
            where.$or = [
                { employeeId: { $in: employeeIds } },
                { month: isNaN(Number(search)) ? -1 : Number(search) },
            ];
        }

        const allowedSorts = ['month', 'year', 'grossSalary', 'netSalary', 'createdAt'];
        const safeSortBy = allowedSorts.includes(sortBy) ? sortBy : 'createdAt';
        const safeSortOrder = sortOrder === 'asc' ? 1 : -1;

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
        const skip = (pageNum - 1) * limitNum;

        const [payslips, totalCount] = await Promise.all([
            Payslip.find(where)
                .populate('employeeId', 'firstName lastName email department position')
                .sort({ [safeSortBy]: safeSortOrder })
                .skip(skip)
                .limit(limitNum),
            Payslip.countDocuments(where)
        ]);

        const data = payslips.map((payslip) => {
            const obj = payslip.toObject();
            return {
                ...obj,
                id: obj._id.toString(),
                employee: obj.employeeId,
                employeeId: obj.employeeId?._id?.toString()
            };
        });

        return {
            data,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalCount / limitNum),
                totalCount,
                limit: limitNum,
            }
        };
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


export const updatePayslip = async (id, updateData) => {

    const payslip = await Payslip.findById(id);
    if (!payslip) {
        throw new AppError("Payslip not found", 404);
    }

    const gross = Number(updateData.grossSalary ?? payslip.grossSalary);
    const allowance = Number(updateData.allowances ?? payslip.allowances);
    const deduction = Number(updateData.deductions ?? payslip.totalDeductions);
    const basic = Math.round(gross * 0.5);
    const houseRent = Math.round(gross * 0.25);
    const medical = Math.round(gross * 0.125);
    const conveyance = Math.round(gross * 0.125);
    const netSalary = gross + allowance - deduction;

    const updated = await Payslip.findByIdAndUpdate(
        id,
        {
            grossSalary: gross,
            basicSalary: basic,
            houseRent,
            medical,
            conveyance,
            allowances: allowance,
            totalDeductions: deduction,
            netSalary
        },
        { new: true }
    ).populate("employeeId").lean();

    return {
        success: true,
        data: {
            ...updated,
            id: updated._id.toString(),
            employee: updated.employeeId
        }
    };
};