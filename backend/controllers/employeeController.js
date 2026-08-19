import Employee from "../models/employeeModel.js";
import * as employeeService from "../services/employeeService.js";


export const createEmp = async (req, res) => {
  try {
    const result = await employeeService.createEmployee(req.body);

    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Failed to create employee",
    });
  }
};


export const getEmps = async (req, res) => {
  try {
    const { department, showDeleted, onlyDeleted } = req.query;

    const result = await employeeService.getEmployees(department, showDeleted === "true", onlyDeleted === "true");

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Failed to fetch employees",
    });
  }
};


export const getEmpById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await employeeService.getEmployeeById(id);

    return res.status(200).json(result);
  } catch (error) {
    if (error.message === "Employee not found") {
      return res.status(404).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: error.message || "Failed to fetch employee",
    });
  }
};


export const updateEmp = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await employeeService.updateEmployee(id, req.body);

    return res.status(200).json(result);
  } catch (error) {
    if (error.message === "Employee Not found") {
      return res.status(404).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: error.message || "Failed to update employee",
    });
  }
};


export const deleteEmp = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await employeeService.deleteEmployee(id);

    return res.status(200).json(result);
  } catch (error) {
    if (error.message === "Employee not found") {
      return res.status(404).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: error.message || "Failed to delete employee",
    });
  }
};
