import Employee from "../models/employeeModel.js";
import { uploadImage } from "./cloudinaryService.js";


export const getProfile = async (userId) => {

    const employee = await Employee.findOne({
        userId
    });

    if (!employee) {
        throw new Error("Employee profile not found");
    }

    return employee;
};

export const updateProfile = async (userId, data) => {
  const employee = await Employee.findOne({userId});

  if (!employee) {
    throw new Error("Employee not found");
  }

  if (employee.isDeleted) {
    throw new Error("Your account is deactivated, you cannot update your profile");
  }

  employee.bio = data.bio;
  if (data.firstName) employee.firstName = data.firstName;
  if (data.lastName !== undefined) employee.lastName = data.lastName;
  if (data.email) employee.email = data.email;
  if (data.mobile !== undefined) employee.mobile = data.mobile;
  if (data.position) employee.position = data.position;
  if (data.department) employee.department = data.department;
  await employee.save();

  return {
    success: true,
    message: "Profile updated successfully",
  };
};

export const uploadProfilePic = async (userId, file) => {
  const employee = await Employee.findOne({ userId });

  if (!employee) {
    throw new Error("Employee not found");
  }

  if (employee.isDeleted) {
    throw new Error("Your account is deactivated");
  }

  if (!file) {
    throw new Error("No file uploaded");
  }

  const result = await uploadImage(file.buffer, "hrms/profile-pics");

  employee.profilePic = result.secure_url;
  await employee.save();

  return {
    success: true,
    message: "Profile picture updated successfully",
    profilePic: result.secure_url,
  };
};
