import * as payrollService from "../services/payrollService.js";



export const generatePayroll = async (req, res) => {

    try {
        const {month, year} = req.body;
        const result = await payrollService.generatePayroll(month, year);

        return res.status(201).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
                success: false,
                error: error.message || "Internal Server Error"
            });
    }
};


export const getCompanyPayroll = async (req, res) => {

    try {
        const {month, year} = req.query;
        const result = await payrollService.getCompanyPayroll(month, year);

        return res.status(200).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
                success: false,
                error:error.message ||"Internal Server Error"
            });
    }
};


export const getDepartmentPayroll = async (req, res) => {

    try {
        const {month, year} = req.query;
        const result = await payrollService.getDepartmentPayroll(req.params.department, month,year);

        return res.status(200).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
                success: false,
                error: error.message || "Internal Server Error"
            });
    }
};



export const getEmployeePayroll = async (req, res) => {

    try {
        const {month, year} = req.query;
        const result = await payrollService.getEmployeePayroll(req.params.employeeId, month, year);

        return res.status(200).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
                success: false,
                error: error.message || "Internal Server Error"
            });
    }
};