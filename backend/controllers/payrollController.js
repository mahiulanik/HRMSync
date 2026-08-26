import * as payrollService from "../services/payrollService.js";
import asyncHandler from "../middlewares/asyncHandler.js";



export const generatePayroll = asyncHandler(async (req, res) => {
    const { month, year } = req.body;

    const result = await payrollService.generatePayroll(month, year);

    return res.status(201).json(result);
});


export const getCompanyPayroll = asyncHandler(async (req, res) => {
    const { month, year } = req.query;

    const result = await payrollService.getCompanyPayroll(month, year);

    return res.status(200).json(result);
});


export const getDepartmentPayroll = asyncHandler(async (req, res) => {
    const { month, year } = req.query;

    const result = await payrollService.getDepartmentPayroll(
        req.params.department,
        month,
        year
    );

    return res.status(200).json(result);
});


export const getEmployeePayroll = asyncHandler(async (req, res) => {
    const { month, year } = req.query;

    const result = await payrollService.getEmployeePayroll(
        req.params.employeeId,
        month,
        year
    );

    return res.status(200).json(result);
});