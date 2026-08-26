import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import Employee from "../models/employeeModel.js";
import AppError from "../utils/AppError.js";


export const createEmployee = async (data) => {
  const {email, firstName,lastName, password, mobile,position, grossSalary, allowances, deductions, employeeStatus, joiningDate, isDeleted, bio, department, role,} = data;

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedMobile = mobile?.trim() || "";

  // Check duplicate email
  const existingUser = await User.findOne({email: normalizedEmail,});

  if (existingUser) {
    throw new AppError("User already exists", 409);
  }

  // Start Transaction
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const user = new User({
      email: normalizedEmail,
      password: hashedPassword,
      role: role || "EMPLOYEE",
    });

    await user.save({ session });

    // Create Employee
    const employee = new Employee({
      userId: user._id,
      email: normalizedEmail,
      firstName,
      lastName,
      mobile: normalizedMobile,
      position,
      grossSalary: Number(grossSalary) || 0,
      basicSalary: Math.round((Number(grossSalary) || 0) * 0.5),
      houseRent: Math.round((Number(grossSalary) || 0) * 0.25),
      medical: Math.round((Number(grossSalary) || 0) * 0.125),
      conveyance: Math.round((Number(grossSalary) || 0) * 0.125),
      allowances: Number(allowances) || 0,
      deductions: Number(deductions) || 0,
      employeeStatus: employeeStatus || "Active",
      joiningDate: new Date(joiningDate),
      isDeleted: isDeleted || false,
      bio: bio || "",
      department,
    });

    await employee.save({ session });

    // Commit Transaction
    await session.commitTransaction();

    return employee;
  } catch (error) {
    // Rollback Transaction
    await session.abortTransaction();

    throw error;
  } finally {
    // Close Session
    await session.endSession();
  }
};


export const getEmployees = async (department, showDeleted, onlyDeleted, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search = '') => {
  const where = {};

  if (onlyDeleted) {
    where.isDeleted = true;
  } else if (!showDeleted) {
    where.isDeleted = false;
  }

  if (department) {
    where.department = department;
  }

  if (search) {
    where.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { position: { $regex: search, $options: 'i' } },
    ];
  }


  const allowedSorts = ['firstName', 'lastName', 'department', 'position', 'grossSalary', 'employeeStatus', 'joiningDate', 'createdAt'];
  const safeSortBy = allowedSorts.includes(sortBy) ? sortBy : 'createdAt';
  const safeSortOrder = sortOrder === 'asc' ? 1 : -1;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [employeeList, totalCount] = await Promise.all([
    Employee.find(where)
      .sort({ [safeSortBy]: safeSortOrder })
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'email role')
      .lean(),
    Employee.countDocuments(where)
  ]);

  const totalPages = Math.ceil(totalCount / limitNum);

  return {
    data: employeeList.map((emp) => ({
      ...emp,
      id: emp._id.toString(),
      user: emp.userId
        ? {
            email: emp.userId.email,
            role: emp.userId.role,
          }
        : null,
    })),
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalCount,
      limit: limitNum,
    }
  };
};


export const getEmployeeById = async (id) => {

  if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid employee ID", 400);
    }

  const employee = await Employee.findById(id)
    .populate("userId", "email role")
    .lean();

  if (!employee) {
    throw new AppError("Employee not found", 404);
  }

  return {
    ...employee,
    id: employee._id.toString(),
    user: employee.userId
      ? {
          email: employee.userId.email,
          role: employee.userId.role,
        }
      : null,
  };
};


export const updateEmployee = async (id, data) => {

  if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid employee ID", 400);
    }

  const {email, firstName, lastName, password, mobile,position, grossSalary, allowances, deductions,employeeStatus, joiningDate,isDeleted,bio, department,role,} = data;

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedMobile = mobile?.trim() || "";

  // Start Transaction
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Update Employee
    const updatedEmployee = await Employee.findOneAndUpdate(
      {
        _id: id,
      },
      {
        email: normalizedEmail,
        firstName,
        lastName,
        mobile: normalizedMobile,
        position,
        grossSalary: Number(grossSalary) || 0,
        basicSalary: Math.round((Number(grossSalary) || 0) * 0.5),
        houseRent: Math.round((Number(grossSalary) || 0) * 0.25),
        medical: Math.round((Number(grossSalary) || 0) * 0.125),
        conveyance: Math.round((Number(grossSalary) || 0) * 0.125),
        allowances: Number(allowances) || 0,
        deductions: Number(deductions) || 0,
        employeeStatus: employeeStatus || "Active",
        joiningDate: new Date(joiningDate),
        isDeleted: isDeleted || false,
        bio: bio || "",
        department,
      },
      {
        returnDocument: "after",
        session,
      },
    );

    // Employee not found
    if (!updatedEmployee) {
      throw new AppError("Employee Not Found", 404);
    }

    // Prepare User Update Object
    const userUpdate = {
      email: normalizedEmail,
    };
    if (role) {
      userUpdate.role = role;
    }
    if (password) {
      userUpdate.password = await bcrypt.hash(password, 10);
    }

    // Update User
    await User.findByIdAndUpdate(
      updatedEmployee.userId, 
      userUpdate,
      {session});

    // Commit Transaction
    await session.commitTransaction();
    return updatedEmployee;

  } catch (error) {
    // Rollback Transaction
    await session.abortTransaction();
    throw error;
  } finally {
    // Close Session
    await session.endSession();
  }
};

export const deleteEmployee = async (id) => {

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid employee ID", 400);
    }

    const employee = await Employee.findById(id);

    if (!employee) {
        throw new AppError("Employee not found", 404);
    }

    employee.isDeleted = true;
    employee.employeeStatus = "Inactive";

    await employee.save();

    return {
        success: true,
        message: "Employee deleted successfully",
    };
};