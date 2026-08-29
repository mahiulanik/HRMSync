import { useState, useEffect } from "react";
import api from "../../api/axios";
import { getApiError } from "../../utils/apiError";
import Modal from "../../components/Modal";

export default function GeneratePayslipModal({ isOpen, onClose, onSuccess }) {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employeeId: "",
    month: "1",
    year: "2026",
    grossSalary: "",
    allowances: "0",
    deductions: "0",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      api
        .get("/employees?limit=100")
        .then((res) => setEmployees(res.data.data || res.data || []))
        .catch(() => {});
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const newForm = { ...form, [e.target.name]: e.target.value };
    if (e.target.name === "employeeId") {
      const emp = employees.find((em) => em._id === e.target.value);
      if (emp) {
        newForm.grossSalary = emp.grossSalary || "";
        newForm.allowances = emp.allowances || "0";
        newForm.deductions = emp.deductions || "0";
      }
    }
    setForm(newForm);
  };

  const gross = Number(form.grossSalary) || 0;
  const basicSalary = Math.round(gross * 0.5);
  const houseRent = Math.round(gross * 0.25);
  const medical = Math.round(gross * 0.125);
  const conveyance = Math.round(gross * 0.125);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/create-payslip", {
        ...form,
        month: Number(form.month),
        year: Number(form.year),
        grossSalary: Number(form.grossSalary),
        allowances: Number(form.allowances) || 0,
        deductions: Number(form.deductions) || 0,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(getApiError(err, "Failed to generate payslip"));
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Monthly Payslip"
      subtitle=""
    >
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Employee</label>
          <select
            name="employeeId"
            value={form.employeeId}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary bg-white"
            required
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.firstName} {emp.lastName} ({emp.position})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Month</label>
            <select
              name="month"
              value={form.month}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary bg-white"
            >
              {monthNames.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Year</label>
            <input
              name="year"
              type="number"
              value={form.year}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Gross Salary</label>
          <input
            name="grossSalary"
            type="number"
            value={form.grossSalary}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary"
            placeholder="10000"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Basic (50%)
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
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Allowances</label>
            <input
              name="allowances"
              type="number"
              value={form.allowances}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Deductions</label>
            <input
              name="deductions"
              type="number"
              value={form.deductions}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary"
            />
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
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
