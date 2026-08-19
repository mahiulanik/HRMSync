import express from "express"
import upload from "../config/multer.js";
const router = express.Router()




// Controllers
import * as employeeController from "../controllers/employeeController.js"
import * as authController from "../controllers/authController.js"
import * as profileController from "../controllers/profileController.js"
import * as attendanceController from "../controllers/attendanceController.js"
import * as leaveController from "../controllers/leaveController.js"
import * as payslipController from "../controllers/payslipController.js"
import * as dashboardController from "../controllers/dashboardController.js"
import * as shiftController from "../controllers/shiftController.js";
import * as shiftAssignmentController from "../controllers/shiftAssignmentController.js";
import * as payrollController from "../controllers/payrollController.js";
import * as publicHolidayController from "../controllers/publicHolidayController.js";
import { createEmployeeValidation, updateEmployeeValidation, employeeIdValidation } from "../validators/employeeValidator.js";
import { loginValidation, changePasswordValidation, forgotPasswordValidation, verifyResetOTPValidation, resetPasswordValidation } from "../validators/authValidator.js";


// Middleware
import { authMiddleware, requiredAdmin } from "../middlewares/authMiddleware.js"
import { authLimiter } from "../middlewares/rateLimiter.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import validate from "../middlewares/validate.js";

// Employee Routes
router.post("/register", authMiddleware, requiredAdmin, createEmployeeValidation, validate, employeeController.createEmp)
router.get("/employees", authMiddleware, requiredAdmin, employeeController.getEmps)
router.get("/employees/:id", authMiddleware, requiredAdmin, employeeIdValidation, validate, employeeController.getEmpById)
router.put("/employees/:id", authMiddleware, requiredAdmin, updateEmployeeValidation, validate, employeeController.updateEmp)
router.delete("/employees/:id", authMiddleware, requiredAdmin, employeeIdValidation, validate, employeeController.deleteEmp)


// Authentication Routes
router.post("/login", loginValidation, validate, authController.login)
router.get("/session", authMiddleware, authController.session)
router.post("/change-password", authMiddleware, changePasswordValidation, validate, asyncHandler(authController.changePass))
router.post("/logout", authMiddleware, authController.logout);
router.post("/refresh-token", authController.refreshToken);
router.post("/forgot-password", forgotPasswordValidation, validate, asyncHandler(authController.sendPasswordResetOTP))
router.post("/verify-reset-otp", verifyResetOTPValidation, validate, asyncHandler(authController.verifyPasswordResetOTP))
router.post("/reset-password", resetPasswordValidation, validate, asyncHandler(authController.resetEmployeePassword))


// Profile Routes
router.get("/profile", authMiddleware, profileController.getUserProfile)
router.post("/profile", authMiddleware, profileController.updateUserProfile)
router.post("/profile/pic", authMiddleware, upload.single("profilePic"), profileController.uploadProfilePic)


// Attendance Routes
router.post("/attendance", authMiddleware, attendanceController.userClockInOut)
router.get("/attendance", authMiddleware, attendanceController.getUserAttendance)
router.get("/admin/attendance", authMiddleware, requiredAdmin, attendanceController.getAdminAttendance)


// Leave Routes
router.post("/create-leave", authMiddleware, leaveController.createUserLeave)
router.get("/get-leaves", authMiddleware, leaveController.getUserLeaves)
router.patch("/update-leave/:id", authMiddleware, requiredAdmin, leaveController.updateUserLeave)


// Payslip Routes
router.post("/create-payslip", authMiddleware, requiredAdmin, payslipController.createUserPayslip)
router.get("/get-payslips", authMiddleware, payslipController.getUsersPayslips)
router.get("/get-payslip-by-id/:id", authMiddleware, payslipController.getUserPayslipById)


// Dashboard Route
router.get("/dashboard", authMiddleware, dashboardController.getDashboard)


// Shift Routes
router.post("/create-shift", authMiddleware, requiredAdmin, shiftController.createShift);
router.get("/shifts", authMiddleware, shiftController.getAllShifts);
router.get("/shift/:id", authMiddleware, shiftController.getShiftById);
router.patch("/update-shift/:id", authMiddleware, requiredAdmin, shiftController.updateShift);
router.delete("/delete-shift/:id", authMiddleware, requiredAdmin, shiftController.deactivateShift);
router.patch("/shift/:id/activate", authMiddleware, requiredAdmin, shiftController.activateShift);


// Shift Assignment Routes
router.post("/assign-shift", authMiddleware, requiredAdmin, shiftAssignmentController.assignShift);
router.post("/assign-shift-month", authMiddleware, requiredAdmin, shiftAssignmentController.assignShiftForMonth);
router.get("/my-shifts", authMiddleware, shiftAssignmentController.getMyShifts);
router.get("/employee-roster/:id", authMiddleware, shiftAssignmentController.getEmployeeRoster);
router.get("/shift/:id/date", authMiddleware, shiftAssignmentController.getShiftByDate);
router.patch("/update-shift-assignment/:id", authMiddleware, requiredAdmin, shiftAssignmentController.updateShiftAssignment);
router.delete("/delete-shift-assignment/:id", authMiddleware, requiredAdmin, shiftAssignmentController.deleteShiftAssignment);


// Payroll Routes(Admin Only)
router.post("/generate-payroll", authMiddleware, requiredAdmin, payrollController.generatePayroll);
router.get("/company-payroll", authMiddleware, requiredAdmin, payrollController.getCompanyPayroll);
router.get("/department-payroll/:department", authMiddleware, requiredAdmin, payrollController.getDepartmentPayroll);
router.get("/employee-payroll/:employeeId", authMiddleware, requiredAdmin, payrollController.getEmployeePayroll);


// Public Holiday Routes
router.post("/public-holidays", authMiddleware, requiredAdmin, publicHolidayController.createPublicHoliday);
router.get("/public-holidays", authMiddleware, publicHolidayController.getAllPublicHolidays);
router.get("/public-holidays/:id", authMiddleware, publicHolidayController.getPublicHolidayById);
router.patch("/public-holidays/:id", authMiddleware, requiredAdmin, publicHolidayController.updatePublicHoliday);
router.delete("/public-holidays/:id", authMiddleware, requiredAdmin, publicHolidayController.deletePublicHoliday);


import {
    testSuccess,
    testError,
    testServerError
} from "../controllers/testController.js";

router.get(
    "/success",
    asyncHandler(testSuccess)
);

router.get(
    "/error",
    asyncHandler(testError)
);

router.get(
    "/server-error",
    asyncHandler(testServerError)
);


export default router
