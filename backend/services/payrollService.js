import mongoose from "mongoose";

import Employee from "../models/employeeModel.js";
import Attendance from "../models/attendanceModel.js";
import Leave from "../models/leaveModel.js";
import Payroll from "../models/payrollModel.js";
import Payslip from "../models/payslipModel.js";

import AppError from "../utils/AppError.js";

import {PAID_LEAVE_TYPES} from "../constants/payroll.js";

import {getMonthDateRange, getWorkingDaysInMonth, normalizeDate, roundMoney, calculateOvertimeAmount} from "../utils/payrollUtils.js";


export const generatePayroll = async (month, year) => {

    month = Number(month);
    year = Number(year);

    const existingPayroll = await Payroll.findOne({
        month,
        year
    });

    if (existingPayroll) {
        throw new AppError(`Payroll already exists for ${month}/${year}`, 409);
    }

    const {startDate, endDate} = getMonthDateRange(month, year);

    const workingDates = getWorkingDaysInMonth(month, year);

    const workingDays = workingDates.length;

    const employees = await Employee.find({
        isDeleted: {
            $ne: true
        },
        employeeStatus: "Active"
    }).lean();

    if (!employees.length) {
        throw new AppError("No active employees found", 404);
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const [payroll] = await Payroll.create(
            [
                {
                    month,
                    year,
                    totalEmployees: employees.length,
                    totalGrossSalary: 0,
                    totalDeductions: 0,
                    totalNetSalary: 0,
                    status: "DRAFT"
                }
            ],
            {
                session
            }
        );

        let totalGrossSalary = 0;
        let totalDeductions = 0;
        let totalNetSalary = 0;


        for (const employee of employees) {

            const employeeId = employee._id;
            const grossSalary = Number(employee.grossSalary || 0);
            const basicSalary = Number(employee.basicSalary || grossSalary * 0.5);
            const houseRent = Number(employee.houseRent || 0);
            const medical = Number(employee.medical || 0);
            const conveyance = Number(employee.conveyance || 0);
            const allowances = Number(employee.allowances || 0);
            const otherDeductions = Number(employee.deductions || 0);


            const attendance = await Attendance.find({
                employeeId,
                date: {
                    $gte: startDate,
                    $lt: endDate
                }
            })
                .session(session)
                .lean();


            const approvedLeaves = await Leave.find({
                employeeId,
                status: "APPROVED",
                startDate: {
                    $lt: endDate
                },
                endDate: {
                    $gte: startDate
                }
            })
                .session(session)
                .lean();


            const presentDates = new Set();

            let overtimeMinutes = 0;

            for (const record of attendance) {

                const attendanceDate = normalizeDate(record.date);

                const dayOfWeek = attendanceDate.getDay();

                // Friday + Saturday
                if ([5, 6].includes(dayOfWeek)) {
                    continue;
                }

                const dateKey = attendanceDate.toISOString().split("T")[0];

                // Only actual attendance counts
                if (record.status === "PRESENT" || record.status === "LATE") {
                    presentDates.add(dateKey);
                }
                overtimeMinutes += Number(record.overtimeMinutes || 0);
            }


            const paidLeaveDates = new Set();

            for (const leave of approvedLeaves) {

                if (!PAID_LEAVE_TYPES.includes(leave.type)
                ) {
                    continue;
                }

                const leaveStart = normalizeDate(leave.startDate);
                const leaveEnd = normalizeDate(leave.endDate);

                for (const workingDate of workingDates) {

                    if (workingDate >= leaveStart && workingDate <= leaveEnd) {

                        const dateKey = workingDate.toISOString().split("T")[0];
                        paidLeaveDates.add(dateKey);
                    }
                }
            }


            for (const date of presentDates) {
                paidLeaveDates.delete(date);
            }


            // Days Calculation

            const presentDays = presentDates.size;
            const paidLeaveDays = paidLeaveDates.size;
            const absentDays = Math.max(workingDays - presentDays - paidLeaveDays, 0);

            const dailyBasicSalary =  workingDays > 0 ? basicSalary / workingDays : 0;

            const overtimeAmount = calculateOvertimeAmount({
                overtimeMinutes,
                basicSalary,
                workingDays,
                shiftHours: 8
            });


            // Gross Salary

            const payslipGross = roundMoney(grossSalary + overtimeAmount);

            // Attendance Check

            const hasAttendance = presentDates.size > 0;
            const hasPaidLeave = paidLeaveDates.size > 0;


            // Deduction + Net Salary

            let unpaidLeaveDeduction = 0;
            let netSalary = 0;

            if (!hasAttendance && !hasPaidLeave) {
                unpaidLeaveDeduction = roundMoney(payslipGross);
                netSalary = 0;

            } else {
                unpaidLeaveDeduction = roundMoney(
                    dailyBasicSalary * absentDays
                );

                const employeeTotalDeductions = roundMoney(unpaidLeaveDeduction + otherDeductions);

                netSalary = roundMoney(payslipGross - employeeTotalDeductions);
            }

            // CREATE PAYSLIP

            await Payslip.create(
                [
                    {
                        payrollId: payroll._id,
                        employeeId,
                        month,
                        year,
                        basicSalary,
                        houseRent,
                        medical,
                        conveyance,
                        allowances,
                        overtimeAmount,
                        grossSalary: payslipGross,
                        unpaidLeaveDeduction,
                        otherDeductions,
                        totalDeductions: employeeTotalDeductions,
                        netSalary,
                        workingDays,
                        presentDays,
                        paidLeaveDays,
                        unpaidLeaveDays: absentDays
                    }
                ],
                {
                    session
                }
            );


            // COMPANY TOTALS

            totalGrossSalary += payslipGross;
            totalDeductions += employeeTotalDeductions;
            totalNetSalary += netSalary;
        }


        // UPDATE PAYROLL

        payroll.totalGrossSalary = roundMoney(totalGrossSalary);
        payroll.totalDeductions = roundMoney(totalDeductions);
        payroll.totalNetSalary = roundMoney(totalNetSalary);
        payroll.status = "PROCESSED";
        payroll.processedAt = new Date();

        await payroll.save({
            session
        });

        // COMMIT

        await session.commitTransaction();

        return {
            success: true,
            data: payroll
        };

    } catch (error) {

        await session.abortTransaction();

        throw error;

    } finally {

        await session.endSession();
    }
};



export const getCompanyPayroll = async (month, year) => {

    month = Number(month);
    year = Number(year);

    const payroll = await Payroll.findOne({month, year}).lean();

    if (!payroll) {
        throw new AppError("Payroll not found for this month", 404);
    }

    return {
        success: true,
        data: {
            id: payroll._id.toString(),
            month: payroll.month,
            year: payroll.year,
            totalEmployees: payroll.totalEmployees,
            totalGrossSalary: payroll.totalGrossSalary,
            totalDeductions: payroll.totalDeductions,
            totalNetSalary: payroll.totalNetSalary,
            status: payroll.status,
            processedAt: payroll.processedAt
        }
    };
};


export const getDepartmentPayroll = async (department, month, year) => {

    month = Number(month);
    year = Number(year);

    if (!department) {
        throw new AppError("Department is required", 400);
    }

    // AGGREGATION

    const result = await Payslip.aggregate([
        {
            $match: {
                month,
                year
            }
        },

        // Join Employee collection
        {
            $lookup: {
                from: "employees",
                localField: "employeeId",
                foreignField: "_id",
                as: "employee"
            }
        },

        // Convert employee array → object
        {
            $unwind: "$employee"
        },

        {
            $match: {
                "employee.department":
                    department
            }
        },

        {
            $group: {
                _id: "$employee.department",
                totalEmployees: {
                    $sum: 1
                },
                totalGrossSalary: {
                    $sum: "$grossSalary"
                },
                totalDeductions: {
                    $sum: "$totalDeductions"
                },
                totalNetSalary: {
                    $sum: "$netSalary"
                }
            }
        },

        // Format response

        {
            $project: {
                _id: 0,
                department: "$_id",
                totalEmployees: 1,
                totalGrossSalary: 1,
                totalDeductions: 1,
                totalNetSalary: 1
            }
        }
    ]);

    if (!result.length) {
        throw new AppError("No payroll found for this department", 404);
    }

    return {
        success: true,
        data: {
            department: result[0].department,
            month,
            year,
            totalEmployees: result[0].totalEmployees,
            totalGrossSalary: roundMoney(result[0].totalGrossSalary),
            totalDeductions:  roundMoney(result[0].totalDeductions),
            totalNetSalary: roundMoney(result[0].totalNetSalary)
        }
    };
};




export const getEmployeePayroll = async (employeeId, month, year) => {

    month = Number(month);
    year = Number(year);

    const payslip = await Payslip.findOne({employeeId, month, year})
        .populate("employeeId")
        .lean();


    if (!payslip) {
        throw new AppError("Payslip not found for this employee and month", 404);
    }

    const employee = payslip.employeeId;

    return {
        success: true,
        data: {
            employee: {
                id: employee._id.toString(),
                firstName: employee.firstName,
                lastName: employee.lastName,
                email: employee.email,
                department: employee.department
            },

            payslip: {
                id: payslip._id.toString(),
                month: payslip.month,
                year: payslip.year,
                basicSalary: payslip.basicSalary,
                houseRent: payslip.houseRent,
                medical: payslip.medical,
                conveyance: payslip.conveyance,
                allowances: payslip.allowances,
                overtimeAmount: payslip.overtimeAmount,
                grossSalary: payslip.grossSalary,
                unpaidLeaveDeduction: payslip.unpaidLeaveDeduction,
                otherDeductions: payslip.otherDeductions,
                totalDeductions: payslip.totalDeductions,
                netSalary: payslip.netSalary,
                workingDays: payslip.workingDays,
                presentDays: payslip.presentDays,
                paidLeaveDays: payslip.paidLeaveDays,
                unpaidLeaveDays: payslip.unpaidLeaveDays
            }
        }
    };
};





