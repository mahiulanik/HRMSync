import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import { Printer } from "lucide-react";

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

export default function EmployeePrintPayslip() {
  const { id } = useParams();
  const [payslip, setPayslip] = useState(null);

  useEffect(() => {
    api
      .get(`/get-payslip-by-id/${id}`)
      .then((res) => setPayslip(res.data.data))
      .catch(() => {});
  }, [id]);

  const handlePrint = () => window.print();

  if (!payslip)
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );

  const emp = payslip.employeeId || {};

  return (
    <div className="max-w-2xl mx-auto">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="print-area bg-card border border-border rounded-xl overflow-hidden mb-6 print:shadow-none print:border-0">
        <div className="bg-gradient-to-br from-primary to-purple-600 text-white py-8 px-6 text-center">
          <h1 className="text-2xl font-bold mb-1">PAYSLIP</h1>
          <p className="text-sm opacity-90">
            {MONTH_NAMES[payslip.month - 1]} {payslip.year}
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-5 mb-6">
            <div>
              <div className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">
                Employee Name
              </div>
              <div className="text-sm font-semibold">
                {emp.firstName} {emp.lastName || ""}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">
                Position
              </div>
              <div className="text-sm font-semibold">{emp.position || "-"}</div>
            </div>
            <div>
              <div className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">
                Email
              </div>
              <div className="text-sm font-semibold">{emp.email || "-"}</div>
            </div>
            <div>
              <div className="text-[11px] text-text-secondary uppercase tracking-wider mb-1">
                Department
              </div>
              <div className="text-sm font-semibold">
                {emp.department || "-"}
              </div>
            </div>
          </div>

          <table className="w-full border-collapse mb-5">
            <thead>
              <tr className="bg-page-bg">
                <th className="text-left text-[11px] uppercase tracking-wider px-4 py-3 text-text-secondary border-b-2 border-border">
                  Description
                </th>
                <th className="text-right text-[11px] uppercase tracking-wider px-4 py-3 text-text-secondary border-b-2 border-border">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="px-4 py-3 text-sm">Gross Salary</td>
                <td className="px-4 py-3 text-sm text-right font-medium">
                  ৳{(payslip.grossSalary || 0).toLocaleString()}
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-4 py-3 text-sm">Basic Salary</td>
                <td className="px-4 py-3 text-sm text-right font-medium">
                  ৳{(payslip.basicSalary || 0).toLocaleString()}
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-4 py-3 text-sm">House Rent</td>
                <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                  +৳{(payslip.houseRent || 0).toLocaleString()}
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-4 py-3 text-sm">Medical</td>
                <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                  +৳{(payslip.medical || 0).toLocaleString()}
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-4 py-3 text-sm">Conveyance</td>
                <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                  +৳{(payslip.conveyance || 0).toLocaleString()}
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-4 py-3 text-sm">Allowances</td>
                <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                  +৳{(payslip.allowances || 0).toLocaleString()}
                </td>
              </tr>
              {payslip.overtimeAmount > 0 && (
                <tr className="border-b border-border/50">
                  <td className="px-4 py-3 text-sm">Overtime</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                    +৳{(payslip.overtimeAmount || 0).toLocaleString()}
                  </td>
                </tr>
              )}
              <tr className="border-b border-border/50">
                <td className="px-4 py-3 text-sm">Unpaid Leave Deduction</td>
                <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">
                  -৳{(payslip.unpaidLeaveDeduction || 0).toLocaleString()}
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-4 py-3 text-sm">Other Deductions</td>
                <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">
                  -৳
                  {(
                    payslip.otherDeductions ||
                    payslip.deductions ||
                    0
                  ).toLocaleString()}
                </td>
              </tr>
              <tr className="bg-page-bg font-bold border-t-2 border-border">
                <td className="px-4 py-4 text-sm border-b-none">
                  Total Deductions
                </td>
                <td className="px-4 py-4 text-sm text-right text-red-600 border-b-none">
                  -৳{(payslip.totalDeductions || 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center mb-5">
            <span className="text-sm font-semibold">Net Salary</span>
            <span className="text-2xl font-bold text-primary">
              ৳{(payslip.netSalary || 0).toLocaleString()}
            </span>
          </div>

          {payslip.workingDays ? (
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-page-bg rounded-lg p-3 text-center">
                <div className="text-lg font-bold">
                  {payslip.workingDays || 0}
                </div>
                <div className="text-[11px] text-text-secondary mt-0.5">
                  Working Days
                </div>
              </div>
              <div className="bg-page-bg rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-600">
                  {payslip.presentDays || 0}
                </div>
                <div className="text-[11px] text-text-secondary mt-0.5">
                  Present
                </div>
              </div>
              <div className="bg-page-bg rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-600">
                  {payslip.paidLeaveDays || 0}
                </div>
                <div className="text-[11px] text-text-secondary mt-0.5">
                  Paid Leave
                </div>
              </div>
              <div className="bg-page-bg rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-red-600">
                  {payslip.unpaidLeaveDays || 0}
                </div>
                <div className="text-[11px] text-text-secondary mt-0.5">
                  Unpaid Leave
                </div>
              </div>
            </div>
          ) : null}

          <div className="text-center text-xs text-text-secondary mt-5 pt-4 border-t border-border">
            Generated on{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-center no-print">
        <button
          onClick={handlePrint}
          className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Printer size={16} /> Print Payslip
        </button>
      </div>
    </div>
  );
}
