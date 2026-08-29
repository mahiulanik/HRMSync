import { useState, useEffect } from "react";
import api from "../../api/axios";
import GeneratePayslipModal from "./GeneratePayslipModal";
import EditPayslipModal from "./EditPayslipModal";
import {
  Plus,
  Download,
  Pencil,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const MONTH_NAMES = [
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

export default function AdminPayslips() {
  const [payslips, setPayslips] = useState([]);
  const [showGenerate, setShowGenerate] = useState(false);
  const [editPayslip, setEditPayslip] = useState(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  });

  const fetchPayslips = () => {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("limit", "10");
    if (search) params.append("search", search);
    api
      .get(`/get-payslips?${params.toString()}`)
      .then((res) => {
        setPayslips(res.data.data || []);
        setPagination(
          res.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalCount: 0,
            limit: 10,
          },
        );
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchPayslips();
  }, [page, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleDownload = async (payslipId) => {
    try {
      const res = await api.get(`/get-payslip-by-id/${payslipId}`);
      const p = res.data.data;
      const emp = p.employee || p.employeeId || {};
      const printWindow = window.open("", "_blank");
      const gross = p.grossSalary || 0;
      const basicSalary = p.basicSalary || Math.round(gross * 0.5);
      const houseRent = p.houseRent || Math.round(gross * 0.25);
      const medical = p.medical || Math.round(gross * 0.125);
      const conveyance = p.conveyance || Math.round(gross * 0.125);
      printWindow.document.write(
        `<!DOCTYPE html><html><head><title>Payslip - ${emp.firstName} ${emp.lastName}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:40px;color:#1a1a2e}.payslip{max-width:700px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden}.header{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;padding:30px;text-align:center}.header h1{font-size:24px;font-weight:700;margin-bottom:4px}.header p{font-size:14px;opacity:.9}.content{padding:30px}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px}.info-item label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#64748b;margin-bottom:4px}.info-item span{font-size:14px;font-weight:600}table{width:100%;border-collapse:collapse;margin-bottom:20px}th{background:#f8fafc;text-align:left;padding:12px 16px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#64748b;border-bottom:2px solid #e2e8f0}th:last-child{text-align:right}td{padding:12px 16px;font-size:14px;border-bottom:1px solid #f1f5f9}td:last-child{text-align:right;font-weight:500}.amount-green{color:#16a34a}.amount-red{color:#dc2626}.total-row{background:#f8fafc;font-weight:700;border-top:2px solid #e2e8f0}.total-row td{border-bottom:none;padding:16px}.net-box{background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;display:flex;justify-content:space-between;align-items:center;margin-top:20px}.net-box .label{font-size:14px;font-weight:600}.net-box .amount{font-size:24px;font-weight:700;color:#4f46e5}.attendance{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:20px}.attendance-item{background:#f8fafc;border-radius:8px;padding:12px;text-align:center}.attendance-item .value{font-size:18px;font-weight:700}.attendance-item .label{font-size:11px;color:#64748b;margin-top:2px}.footer{text-align:center;padding:20px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8}</style></head><body><div class="payslip"><div class="header"><h1>Monthly Payslip</h1><p>${MONTH_NAMES[p.month - 1]} ${p.year}</p></div><div class="content"><div class="info-grid"><div class="info-item"><label>Employee Name</label><span>${emp.firstName} ${emp.lastName}</span></div><div class="info-item"><label>Department</label><span>${emp.department || "N/A"}</span></div><div class="info-item"><label>Position</label><span>${emp.position || "N/A"}</span></div><div class="info-item"><label>Email</label><span>${emp.email || "N/A"}</span></div></div><table><thead><tr><th>Earnings</th><th>Amount</th></tr></thead><tbody><tr><td>Basic Salary</td><td class="amount-green">৳${basicSalary.toLocaleString()}</td></tr><tr><td>House Rent</td><td class="amount-green">৳${houseRent.toLocaleString()}</td></tr><tr><td>Medical</td><td class="amount-green">৳${medical.toLocaleString()}</td></tr><tr><td>Conveyance</td><td class="amount-green">৳${conveyance.toLocaleString()}</td></tr><tr><td>Allowances</td><td class="amount-green">৳${(p.allowances || 0).toLocaleString()}</td></tr><tr><td>Overtime</td><td class="amount-green">৳${(p.overtimeAmount || 0).toLocaleString()}</td></tr><tr class="total-row"><td>Total Earnings</td><td class="amount-green">৳${gross.toLocaleString()}</td></tr></tbody></table><table><thead><tr><th>Deductions</th><th>Amount</th></tr></thead><tbody><tr><td>Unpaid Leave</td><td class="amount-red">৳${(p.unpaidLeaveDeduction || 0).toLocaleString()}</td></tr><tr><td>Other Deductions</td><td class="amount-red">৳${(p.otherDeductions || 0).toLocaleString()}</td></tr><tr class="total-row"><td>Total Deductions</td><td class="amount-red">৳${(p.totalDeductions || 0).toLocaleString()}</td></tr></tbody></table><div class="net-box"><span class="label">Net Salary</span><span class="amount">৳${(p.netSalary || 0).toLocaleString()}</span></div><div class="attendance"><div class="attendance-item"><div class="value">${p.workingDays || 0}</div><div class="label">Working Days</div></div><div class="attendance-item"><div class="value">${p.presentDays || 0}</div><div class="label">Present</div></div><div class="attendance-item"><div class="value">${p.paidLeaveDays || 0}</div><div class="label">Paid Leave</div></div><div class="attendance-item"><div class="value">${p.unpaidLeaveDays || 0}</div><div class="label">Unpaid Leave</div></div></div></div><div class="footer">Generated by HRMSync</div></div></body></html>`,
      );
      printWindow.document.close();
    } catch {
      alert("Failed to load payslip");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Payslips</h1>
          <p className="text-text-secondary text-sm">
            Generate and manage employee payslips
          </p>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus size={18} /> Generate Payslip
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            type="text"
            placeholder="Search by employee name..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setSearch(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-border bg-page-bg/50">
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">
                  Employee
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">
                  Period
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">
                  Gross Salary
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">
                  Net Salary
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {payslips.map((p) => (
                <tr
                  key={p._id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 sm:px-6 py-4 text-sm font-medium">
                    {p.employee?.firstName || p.employeeId?.firstName}{" "}
                    {p.employee?.lastName || p.employeeId?.lastName}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-text-secondary">
                    {MONTH_NAMES[p.month - 1]} {p.year}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm">
                    ৳{p.grossSalary?.toLocaleString()}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm font-semibold">
                    ৳{p.netSalary?.toLocaleString()}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(p._id)}
                        className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full hover:bg-primary/20 flex items-center gap-1"
                      >
                        <Download size={12} /> Download
                      </button>
                      <button
                        onClick={() => setEditPayslip(p)}
                        className="text-xs bg-warning/10 text-warning px-3 py-1 rounded-full hover:bg-warning/20 flex items-center gap-1"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {payslips.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-text-secondary"
                  >
                    No payslips found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <div className="text-sm text-text-secondary">
            Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
            {Math.min(
              pagination.currentPage * pagination.limit,
              pagination.totalCount,
            )}{" "}
            of {pagination.totalCount} payslips
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-border rounded-lg hover:bg-page-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === pagination.totalPages ||
                  Math.abs(p - page) <= 1,
              )
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} className="px-1 text-text-secondary">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === p ? "bg-primary text-white" : "border border-border hover:bg-page-bg"}`}
                  >
                    {p}
                  </button>
                ),
              )}
            <button
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page === pagination.totalPages}
              className="p-2 border border-border rounded-lg hover:bg-page-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      <GeneratePayslipModal
        isOpen={showGenerate}
        onClose={() => setShowGenerate(false)}
        onSuccess={fetchPayslips}
      />
      <EditPayslipModal
        isOpen={!!editPayslip}
        onClose={() => setEditPayslip(null)}
        onSuccess={fetchPayslips}
        payslip={editPayslip}
      />
    </div>
  );
}
