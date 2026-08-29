import { useState } from "react";
import api from "../../api/axios";
import { getApiError } from "../../utils/apiError";
import Modal from "../../components/Modal";

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

export default function AddEmployeeModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    joiningDate: "",
    bio: "",
    department: "",
    position: "",
    grossSalary: "",
    allowances: "",
    deductions: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const gross = Number(form.grossSalary) || 0;
  const basicSalary = Math.round(gross * 0.5);
  const houseRent = Math.round(gross * 0.25);
  const medical = Math.round(gross * 0.125);
  const conveyance = Math.round(gross * 0.125);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/register", {
        ...form,
        grossSalary: Number(form.grossSalary) || 0,
        allowances: Number(form.allowances) || 0,
        deductions: Number(form.deductions) || 0,
      });
      onSuccess();
      onClose();
      setForm({
        firstName: "",
        lastName: "",
        mobile: "",
        joiningDate: "",
        bio: "",
        department: "",
        position: "",
        grossSalary: "",
        allowances: "",
        deductions: "",
        email: "",
        password: "",
      });
    } catch (err) {
      setError(getApiError(err, "Failed to create employee"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Employee"
      subtitle="Create a user account and employee profile"
      maxWidth="max-w-2xl"
    >
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="bg-page-bg rounded-lg p-5 mb-4">
          <h3 className="font-semibold mb-4">Personal Information</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                First Name
              </label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary"
                required
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
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Bio (Optional)
            </label>
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

        <div className="bg-page-bg rounded-lg p-5 mb-4">
          <h3 className="font-semibold mb-4">Employment Details</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Department
              </label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary bg-white"
                required
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
              <label className="block text-sm font-medium mb-1">Position</label>
              <input
                name="position"
                value={form.position}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary"
                required
              />
            </div>
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
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Basic Salary (50%)
              </label>
              <input
                type="number"
                value={basicSalary}
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
                value={houseRent}
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
                value={medical}
                readOnly
                className="w-full px-3 py-2.5 border border-border rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Conveyance (12.5%)
              </label>
              <input
                type="number"
                value={conveyance}
                readOnly
                className="w-full px-3 py-2.5 border border-border rounded-lg bg-gray-50 text-gray-500"
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
          </div>
        </div>

        <div className="bg-page-bg rounded-lg p-5 mb-6">
          <h3 className="font-semibold mb-4">Account Credentials</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-page-bg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Employee"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
