import * as payslipService from "../services/payslipService.js";
import asyncHandler from "../middlewares/asyncHandler.js";


export const createUserPayslip = asyncHandler(async (req, res) => {
    const result = await payslipService.createPayslip(req.body);

    return res.status(201).json(result);
});

export const getUsersPayslips = asyncHandler(async (req, res) => {
    const { page, limit, search, sortBy, sortOrder } = req.query;
    const result = await payslipService.getPayslips(
        req.session,
        page,
        limit,
        search,
        sortBy,
        sortOrder
    );

    return res.status(200).json(result);
});

export const getUserPayslipById = asyncHandler(async (req, res) => {
    const result = await payslipService.getPayslipById(
        req.params.id,
        req.session
    );

    return res.status(200).json(result);
});

export const updateUserPayslip = asyncHandler(async (req, res) => {
    const result = await payslipService.updatePayslip(
        req.params.id,
        req.body
    );

    return res.status(200).json(result);
});