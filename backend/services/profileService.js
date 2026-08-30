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


export const updateProfile = async (userId, data, role) => {

    const employee = await Employee.findOne({
        userId,
        isDeleted: false
    });

    if (!employee) {
        throw new AppError("Employee not found", 404);
    }

    // Employees can only update these fields; admins can update all
    const employeeAllowed = ["firstName", "lastName", "mobile", "position", "bio", "profilePic"];
    const adminAllowed = [...employeeAllowed, "email", "department", "grossSalary", "basicSalary", "houseRent", "medical", "conveyance", "allowances", "deductions", "employeeStatus", "joiningDate"];

    const allowedFields = role === "ADMIN" ? adminAllowed : employeeAllowed;

    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            employee[field] = data[field];
        }
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