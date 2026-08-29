import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { getApiError } from "../../utils/apiError";
import Avatar from "../../components/Avatar";
import { ArrowLeft, Save, Trash2, RotateCcw } from "lucide-react";

const DEPARTMENTS = [
  "Administration",
  "Human Resources",
  "Finance & Accounts",
  "Sales",
  "Marketing",
  "Customer Support",
  "Operations",
  "Supply Chain",
  "Procurement",
  "Information Technology",
  "Software Development",
  "Legal",
  "Internal Audit",
  "Design",
  "Business Intelligence",
];

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [pendingReactivate, setPendingReactivate] = useState(false);

  useEffect(() => {
    api
      .get(`/employees/${id}`)
      .then((res) => {
        const emp = res.data;

        setIsDeleted(emp.isDeleted || false);

        setForm({
          firstName: emp.firstName || "",
          lastName: emp.lastName || "",
          email: emp.email || "",
          mobile: emp.mobile || "",
          position: emp.position || "",
          department: emp.department || "",
          joiningDate: emp.joiningDate
            ? new Date(emp.joiningDate).toISOString().split("T")[0]
            : "",
          grossSalary: emp.grossSalary || 0,

          // Backend calculated values
          basicSalary: emp.basicSalary || 0,
          houseRent: emp.houseRent || 0,
          medical: emp.medical || 0,
          conveyance: emp.conveyance || 0,
          allowances: emp.allowances || 0,
          deductions: emp.deductions || 0,
          bio: emp.bio || "",
          employeeStatus: emp.employeeStatus || "Active",
          profilePic: emp.profilePic || null,
          password: "",
          role: emp.user?.role || "EMPLOYEE",
        });

        setLoading(false);
      })
      .catch((error) => {
        console.error("EMPLOYEE PROFILE ERROR:", error.response?.data || error);

        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    try {
      const body = {
        ...form,

        grossSalary: Number(form.grossSalary) || 0,
        basicSalary: Number(form.basicSalary) || 0,
        houseRent: Number(form.houseRent) || 0,
        medical: Number(form.medical) || 0,
        conveyance: Number(form.conveyance) || 0,
        allowances: Number(form.allowances) || 0,
        deductions: Number(form.deductions) || 0,
      };

      if (pendingReactivate) {
        body.isDeleted = false;
        body.employeeStatus = "Active";
      }

      if (!body.password) {
        delete body.password;
      }

      await api.put(`/employees/${id}`, body);

      if (pendingReactivate) {
        setIsDeleted(false);
        setPendingReactivate(false);

        setForm((prev) => ({
          ...prev,
          employeeStatus: "Active",
        }));

        setMsg("Employee reactivated successfully");
      } else {
        setMsg("Profile updated successfully");
      }
    } catch (err) {
      setMsg(getApiError(err, "Failed to update employee"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/employees/${id}`);

      navigate("/admin/employees");
    } catch (err) {
      setMsg(getApiError(err, "Failed to delete employee"));
    }
  };

  const handleReactivate = () => {
    setPendingReactivate(true);

    setForm((prev) => ({
      ...prev,
      employeeStatus: "Active",
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-12 text-text-secondary">
        Employee not found
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate("/admin/employees")}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 text-sm"
      >
        <ArrowLeft size={16} /> Back to employees
      </button>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Avatar
            name={`${form.firstName} ${form.lastName}`}
            profilePic={form.profilePic}
            size="lg"
          />
          <div>
            <h1 className="text-2xl font-bold">
              {form.firstName} {form.lastName}
            </h1>
            <p className="text-text-secondary text-sm">
              {form.position} {form.department ? `- ${form.department}` : ""}
            </p>
            {isDeleted && (
              <span className="inline-block mt-1 bg-red-50 text-red-600 text-xs px-3 py-1 rounded-full font-medium border border-red-200">
                DEACTIVATED
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {isDeleted && !pendingReactivate ? (
            <button
              onClick={handleReactivate}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <RotateCcw size={16} /> Reactivate Employee
            </button>
          ) : pendingReactivate ? (
            <span className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-300 rounded-lg text-sm font-medium">
              <RotateCcw size={16} /> Reactivation pending — click Save
            </span>
          ) : (
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} /> Delete Employee
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-lg mb-4 text-sm ${msg.includes("success") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
        >
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  First Name
                </label>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Last Name
                </label>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Phone Number
              </label>
              <input
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Join Date
              </label>
              <input
                name="joiningDate"
                type="date"
                value={form.joiningDate}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary resize-none"
                placeholder="Brief description..."
              />
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Employment Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Department
                </label>
                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary bg-white"
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Position
                </label>
                <input
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="employeeStatus"
                  value={form.employeeStatus}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary bg-white"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Salary</h2>

            {/* Gross Salary / Allowances / Deductions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Gross Salary
                </label>

                <input
                  name="grossSalary"
                  type="number"
                  value={form.grossSalary}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Allowances
                </label>

                <input
                  name="allowances"
                  type="number"
                  value={form.allowances}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Deductions
                </label>

                <input
                  name="deductions"
                  type="number"
                  value={form.deductions}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Salary Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Basic Salary (50%)
                </label>

                <input
                  type="number"
                  value={form.basicSalary}
                  readOnly
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  House Rent (25%)
                </label>

                <input
                  type="number"
                  value={form.houseRent}
                  readOnly
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Medical (12.5%)
                </label>

                <input
                  type="number"
                  value={form.medical}
                  readOnly
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
            </div>

            {/* Conveyance */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Conveyance (12.5%)
                </label>

                <input
                  type="number"
                  value={form.conveyance}
                  readOnly
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Reset Password</h2>
            <div>
              <label className="block text-sm font-medium mb-1">
                New Password (leave blank to keep current)
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary"
                minLength={8}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {showDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDelete(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold mb-2">Delete Employee</h3>
            <p className="text-text-secondary text-sm mb-6">
              Are you sure you want to delete {form.firstName} {form.lastName}?
              This action will deactivate their account.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-page-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
