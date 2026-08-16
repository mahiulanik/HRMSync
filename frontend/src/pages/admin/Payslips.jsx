import { useState, useEffect } from 'react';
import api from '../../api/axios';
import GeneratePayslipModal from './GeneratePayslipModal';
import { Plus, Download } from 'lucide-react';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function AdminPayslips() {
  const [payslips, setPayslips] = useState([]);
  const [showGenerate, setShowGenerate] = useState(false);

  const fetchPayslips = () => { api.get('/get-payslips').then(res => setPayslips(res.data.data || [])).catch(() => {}); };
  useEffect(() => { fetchPayslips(); }, []);

  const handleDownload = async (payslipId) => {
    try {
      const res = await api.get(`/get-payslip-by-id/${payslipId}`);
      const p = res.data.data;
      const emp = p.employee || p.employeeId || {};
      const printWindow = window.open('', '_blank');
      const gross = p.grossSalary || 0;
      const basicSalary = p.basicSalary || Math.round(gross * 0.5);
      const houseRent = p.houseRent || Math.round(gross * 0.25);
      const medical = p.medical || Math.round(gross * 0.125);
      const conveyance = p.conveyance || Math.round(gross * 0.125);
      printWindow.document.write(`<!DOCTYPE html><html><head><title>Payslip - ${emp.firstName} ${emp.lastName}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:40px;color:#1a1a2e}.payslip{max-width:700px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden}.header{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;padding:30px;text-align:center}.header h1{font-size:24px;font-weight:700;margin-bottom:4px}.header p{font-size:14px;opacity:.9}.content{padding:30px}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px}.info-item label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#64748b;margin-bottom:4px}.info-item span{font-size:14px;font-weight:600}table{width:100%;border-collapse:collapse;margin-bottom:20px}th{background:#f8fafc;text-align:left;padding:12px 16px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#64748b;border-bottom:2px solid #e2e8f0}th:last-child{text-align:right}td{padding:12px 16px;font-size:14px;border-bottom:1px solid #f1f5f9}td:last-child{text-align:right;font-weight:500}.amount-green{color:#16a34a}.amount-red{color:#dc2626}.total-row{background:#f8fafc;font-weight:700;border-top:2px solid #e2e8f0}.total-row td{border-bottom:none;padding:16px}.net-box{background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;display:flex;justify-content:space-between;align-items:center;margin-top:20px}.net-box .label{font-size:14px;font-weight:600}.net-box .amount{font-size:24px;font-weight:700;color:#4f46e5}.attendance{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:20px}.attendance-item{background:#f8fafc;border-radius:8px;padding:12px;text-align:center}.attendance-item .value{font-size:18px;font-weight:700}.attendance-item .label{font-size:11px;color:#64748b;margin-top:2px}.footer{text-align:center;padding:20px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8}@media print{body{padding:20px}.payslip{border:none;box-shadow:none}.no-print{display:none!important}}</style></head><body><div class="payslip"><div class="header"><h1>PAYSLIP</h1><p>${MONTH_NAMES[p.month-1]} ${p.year}</p></div><div class="content"><div class="info-grid"><div class="info-item"><label>Employee Name</label><span>${emp.firstName} ${emp.lastName||''}</span></div><div class="info-item"><label>Position</label><span>${emp.position||'-'}</span></div><div class="info-item"><label>Email</label><span>${emp.email||'-'}</span></div><div class="info-item"><label>Department</label><span>${emp.department||'-'}</span></div></div><table><thead><tr><th>Description</th><th>Amount</th></tr></thead><tbody><tr><td>Gross Salary</td><td>${gross.toLocaleString()}</td></tr><tr><td>Basic Salary</td><td>${basicSalary.toLocaleString()}</td></tr><tr><td>House Rent</td><td class="amount-green">${houseRent.toLocaleString()}</td></tr><tr><td>Medical</td><td class="amount-green">${medical.toLocaleString()}</td></tr><tr><td>Conveyance</td><td class="amount-green">${conveyance.toLocaleString()}</td></tr><tr><td>Allowances</td><td class="amount-green">${(p.allowances||0).toLocaleString()}</td></tr>${p.overtimeAmount?`<tr><td>Overtime</td><td class="amount-green">${(p.overtimeAmount||0).toLocaleString()}</td></tr>`:''}<tr><td>Unpaid Leave Deduction</td><td class="amount-red">${(p.unpaidLeaveDeduction||0).toLocaleString()}</td></tr><tr><td>Other Deductions</td><td class="amount-red">${(p.otherDeductions||p.deductions||0).toLocaleString()}</td></tr><tr class="total-row"><td>Total Deductions</td><td class="amount-red">${(p.totalDeductions||0).toLocaleString()}</td></tr></tbody></table><div class="net-box"><span class="label">Net Salary</span><span class="amount">${(p.netSalary||0).toLocaleString()}</span></div>${p.workingDays?`<div class="attendance"><div class="attendance-item"><div class="value">${p.workingDays||0}</div><div class="label">Working Days</div></div><div class="attendance-item"><div class="value" style="color:#16a34a">${p.presentDays||0}</div><div class="label">Present</div></div><div class="attendance-item"><div class="value" style="color:#2563eb">${p.paidLeaveDays||0}</div><div class="label">Paid Leave</div></div><div class="attendance-item"><div class="value" style="color:#dc2626">${p.unpaidLeaveDays||0}</div><div class="label">Unpaid Leave</div></div></div>`:''}</div><div class="footer">Generated on ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div></div><div class="no-print" style="text-align:center;margin-top:20px"><button onclick="window.print()" style="background:#4f46e5;color:white;border:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">Print Payslip</button></div></body></html>`);
      printWindow.document.close();
    } } catch { alert('Failed to load payslip'); }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div><h1 className="text-2xl font-bold">Payslips</h1><p className="text-text-secondary text-sm">Generate and manage employee payslips</p></div>
        <button onClick={() => setShowGenerate(true)} className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"><Plus size={18} /> Generate Payslip</button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead><tr className="border-b border-border bg-page-bg/50">
              <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">Employee</th>
              <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">Period</th>
              <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">Gross Salary</th>
              <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">Net Salary</th>
              <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">Actions</th>
            </tr></thead>
            <tbody>{payslips.map(p => (
              <tr key={p._id} className="border-b border-border last:border-0">
                <td className="px-4 sm:px-6 py-4 text-sm font-medium">{p.employee?.firstName || p.employeeId?.firstName} {p.employee?.lastName || p.employeeId?.lastName}</td>
                <td className="px-4 sm:px-6 py-4 text-sm text-text-secondary">{MONTH_NAMES[p.month - 1]} {p.year}</td>
                <td className="px-4 sm:px-6 py-4 text-sm">{p.grossSalary?.toLocaleString()}</td>
                <td className="px-4 sm:px-6 py-4 text-sm font-semibold">{p.netSalary?.toLocaleString()}</td>
                <td className="px-4 sm:px-6 py-4"><button onClick={() => handleDownload(p._id)} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full hover:bg-primary/20 flex items-center gap-1"><Download size={12} /> Download</button></td>
              </tr>
            ))}{payslips.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-text-secondary">No payslips found</td></tr>}</tbody>
          </table>
        </div>
      </div>
      <GeneratePayslipModal isOpen={showGenerate} onClose={() => setShowGenerate(false)} onSuccess={fetchPayslips} />
    </div>
  );
}
