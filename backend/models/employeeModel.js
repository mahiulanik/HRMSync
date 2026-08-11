import mongoose from "mongoose";
import { DEPARTMENTS } from "../constants/departments.js";

const employeeSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true},
    email: {type: String, required: true, unique: true, lowercase: true, trim: true},
    firstName: {type: String, required: true},
    lastName: {type: String},
    mobile: {type: String, trim: true},
    position: {type: String, required: true},
    grossSalary: {type: Number, default: 0},
    basicSalary: {type: Number, default: 0},
    houseRent: {type: Number, default: 0},
    medical: {type: Number, default: 0},
    conveyance: {type: Number, default: 0},
    allowances: {type: Number, default: 0},
    deductions: {type: Number, default: 0},
    employeeStatus: {type: String, enum: ["Active", "Inactive"], default: "Active"},
    joiningDate: {type: Date, required: true},
    isDeleted: {type: Boolean, required: false},
    bio: {type: String, default: ""},
    department: {type: String, default: "", enum: DEPARTMENTS},
    profilePic: {type: String, default: null}
}, {timestamps: true, versionKey: false})


const Employee = mongoose.model("Employee", employeeSchema)

export default Employee