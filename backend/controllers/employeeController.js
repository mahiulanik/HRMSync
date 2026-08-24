import * as employeeService from "../services/employeeService.js";
import asyncHandler from "../middlewares/asyncHandler.js";


export const createEmp = asyncHandler(async (req, res) => {
    const result = await employeeService.createEmployee(req.body);

    return res.status(201).json(result);
});


export const getEmps = asyncHandler(async (req, res) => {
    const { department, showDeleted, onlyDeleted } = req.query;

    const result = await employeeService.getEmployees(
        department,
        showDeleted === "true",
        onlyDeleted === "true"
    );

    return res.status(200).json(result);
});


export const getEmpById = asyncHandler(async (req, res) => {
    const result = await employeeService.getEmployeeById(
        req.params.id
    );

    return res.status(200).json(result);
});


export const updateEmp = asyncHandler(async (req, res) => {
    const result = await employeeService.updateEmployee(
        req.params.id,
        req.body
    );

    return res.status(200).json(result);
});


export const deleteEmp = asyncHandler(async (req, res) => {
    const result = await employeeService.deleteEmployee(
        req.params.id
    );

    return res.status(200).json(result);
});