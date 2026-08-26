import Employee from "../models/employeeModel.js";
import AppError from "../utils/AppError.js";
import { uploadImage } from "./cloudinaryService.js";


export const getProfile = async (session) => {

    const employee = await Employee.findOne({
        userId: session.userId,
        isDeleted: false
    });

    if (!employee) {
        if (session.role === "ADMIN") {
            return {
                success: true,
                data: {
                    firstName: "Admin",
                    lastName: "",
                    email: session.email,
                    role: session.role
                }
            };
        }

        throw new AppError("Employee not found", 404);
    }

    return {
        success: true,
        data: employee
    };
};


export const updateProfile = async (userId, data) => {

    const employee = await Employee.findOne({
        userId,
        isDeleted: false
    });

    if (!employee) {
        throw new AppError("Employee not found", 404);
    }

    if (data.firstName !== undefined) {
        employee.firstName = data.firstName;
    }

    if (data.lastName !== undefined) {
        employee.lastName = data.lastName;
    }

    if (data.email !== undefined) {
        employee.email = data.email;
    }

    if (data.mobile !== undefined) {
        employee.mobile = data.mobile;
    }

    if (data.position !== undefined) {
        employee.position = data.position;
    }

    if (data.department !== undefined) {
        employee.department = data.department;
    }

    if (data.bio !== undefined) {
        employee.bio = data.bio;
    }

    if (data.grossSalary !== undefined) {
        employee.grossSalary = Number(data.grossSalary);
    }

    if (data.basicSalary !== undefined) {
        employee.basicSalary = Number(data.basicSalary);
    }

    if (data.houseRent !== undefined) {
        employee.houseRent = Number(data.houseRent);
    }

    if (data.medical !== undefined) {
        employee.medical = Number(data.medical);
    }

    if (data.conveyance !== undefined) {
        employee.conveyance = Number(data.conveyance);
    }

    if (data.allowances !== undefined) {
        employee.allowances = Number(data.allowances);
    }

    if (data.deductions !== undefined) {
        employee.deductions = Number(data.deductions);
    }

    if (data.employeeStatus !== undefined) {
        employee.employeeStatus = data.employeeStatus;
    }

    if (data.joiningDate !== undefined) {
        employee.joiningDate = data.joiningDate;
    }

    await employee.save();

    return {
        success: true,
        message: "Profile updated successfully",
        data: employee
    };
};


export const uploadProfilePic = async (userId, file) => {

    const employee = await Employee.findOne({
        userId,
        isDeleted: false
    });

    if (!employee) {
        throw new AppError("Employee not found", 404);
    }

    if (!file) {
        throw new AppError("No file uploaded", 400);
    }

    const result = await uploadImage(
        file.buffer,
        "hrms/profile-pics"
    );

    employee.profilePic = result.secure_url;

    await employee.save();

    return {
        success: true,
        message: "Profile picture updated successfully",
        profilePic: result.secure_url
    };
};