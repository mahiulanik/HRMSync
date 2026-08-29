import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import LoginPage from "./pages/LoginPage";
import AdminLayout from "./layouts/AdminLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminEmployees from "./pages/admin/Employees";
import AdminLeave from "./pages/admin/LeaveManagement";
import AdminPayslips from "./pages/admin/Payslips";
import AdminSettings from "./pages/admin/Settings";
import AdminEmployeeProfile from "./pages/admin/EmployeeProfile";
import AdminAttendance from "./pages/admin/Attendance";
import EmployeeDashboard from "./pages/employee/Dashboard";
import EmployeeAttendance from "./pages/employee/Attendance";
import EmployeeLeave from "./pages/employee/LeaveManagement";
import EmployeePayslips from "./pages/employee/Payslips";
import EmployeePrintPayslip from "./pages/employee/PrintPayslip";
import EmployeeSettings from "./pages/employee/Settings";
import EmployeeShift from "./pages/employee/Shift";
import AdminShift from "./pages/admin/Shift";
import AdminPayroll from "./pages/admin/Payroll";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Navigate
              to={
                user.role === "ADMIN"
                  ? "/admin/dashboard"
                  : "/employee/dashboard"
              }
              replace
            />
          ) : (
            <Landing />
          )
        }
      />
      <Route
        path="/admin/login"
        element={
          user ? (
            <Navigate to="/admin/dashboard" replace />
          ) : (
            <LoginPage role="admin" />
          )
        }
      />
      <Route
        path="/employee/login"
        element={
          user ? (
            <Navigate to="/employee/dashboard" replace />
          ) : (
            <LoginPage role="employee" />
          )
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="employees" element={<AdminEmployees />} />
        <Route path="employees/:id" element={<AdminEmployeeProfile />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="leave" element={<AdminLeave />} />
        <Route path="shift" element={<AdminShift />} />
        <Route path="payroll" element={<AdminPayroll />} />
        <Route path="payslips" element={<AdminPayslips />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRole="EMPLOYEE">
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="attendance" element={<EmployeeAttendance />} />
        <Route path="leave" element={<EmployeeLeave />} />
        <Route path="shift" element={<EmployeeShift />} />
        <Route path="payslips" element={<EmployeePayslips />} />
        <Route path="payslips/:id" element={<EmployeePrintPayslip />} />
        <Route path="settings" element={<EmployeeSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
