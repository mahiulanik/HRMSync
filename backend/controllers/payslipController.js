import * as payslipService from "../services/payslipService.js";


export const createUserPayslip = async (req, res) => {
    try {
        const result = await payslipService.createPayslip(req.body);
        return res.status(201).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};


export const getUsersPayslips = async (req, res) => {
    try {
        const result = await payslipService.getPayslips(
            req.session
        );
        return res.status(200).json(result);
    } catch (error) {

        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};


export const getUserPayslipById = async (req, res) => {
    try {
        const result = await payslipService.getPayslipById(
            req.params.id,
            req.session
        );
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};