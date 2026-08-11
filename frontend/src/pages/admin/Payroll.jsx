import { useState, useEffect } from 'react';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import { DollarSign, Users, Building2, TrendingUp, Loader2 } from 'lucide-react';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DEPARTMENTS = ['Administration','Human Resources','Finance & Accounts','Sales','Marketing','Customer Support','Operations','Supply Chain','Procurement','Information Technology','Software Development','Legal','Internal Audit','Design','Business Intelligence'];

export default function AdminPayroll() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState('');
  const [companyPayroll, setCompanyPayroll] = useState(null);
  const [departmentPayroll, setDepartmentPayroll] = useState(null);
  const [employeePayroll, setEmployeePayroll] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees, setEmployees] = useState([]);
  const [viewTab, setViewTab] = useState('company');

  useEffect(() => { api.get('/employees').then(res => setEmployees(res.data || [])).catch(() => {}); }, []);

  const fetchCompanyPayroll = () => {
    api.get(`/company-payroll?month=${month}&year=${year}`).then(res => { setCompanyPayroll(res.data.data); setMsg(''); }).catch(() => { setCompanyPayroll(null); });
  };
  const fetchDepartmentPayroll = () => {
    if (!selectedDepartment) return;
    api.get(`/department-payroll/${selectedDepartment}?month=${month}&year=${year}`).then(res => { setDepartmentPayroll(res.data.data); setMsg(''); }).catch(() => { setDepartmentPayroll(null); });
  };
  const fetchEmployeePayroll = () => {
    if (!selectedEmployee) return;
    api.get(`/employee-payroll/${selectedEmployee}?month=${month}&year=${year}`).then(res => { setEmployeePayroll(res.data.data); setMsg(''); }).catch(() => { setEmployeePayroll(null); });
  };

  useEffect(() => { setCompanyPayroll(null); setDepartmentPayroll(null); setEmployeePayroll(null); if (viewTab === 'company') fetchCompanyPayroll(); }, [month, year, viewTab]);
  useEffect(() => { if (viewTab === 'department' && selectedDepartment) fetchDepartmentPayroll(); }, [selectedDepartment, month, year, viewTab]);
  useEffect(() => { if (viewTab === 'employee' && selectedEmployee) fetchEmployeePayroll(); }, [selectedEmployee, month, year, viewTab]);

  const handleGenerate = async () => {
    setGenerating(true); setMsg('');
    try { await api.post('/generate-payroll', { month, year }); setMsg('Payroll generated successfully'); fetchCompanyPayroll(); }
    catch (err) { setMsg(err.response?.data?.error || 'Failed to generate payroll'); }
    finally { setGenerating(false); }
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div>
      <h1 className="text-2xl font-bold">Payroll Management</h1>
      <p className="text-text-secondary text-sm mb-6">Generate and manage company payroll based on attendance</p>

      <div className="flex flex-wrap gap-3 sm:gap-4 mb-6">
        <select value={month} onChange={e => setMonth(Number(e.target.value))} className="px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary bg-white">
          {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary bg-white">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={handleGenerate} disabled={generating} className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50">
          {generating ? <Loader2 size={18} className="animate-spin" /> : <DollarSign size={18} />}
          {generating ? 'Generating...' : 'Generate Payroll'}
        </button>
      </div>

      {msg && <div className={`p-3 rounded-lg mb-4 text-sm ${msg.includes('success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{msg}</div>}

      <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
        {[{ key: 'company', label: 'Company Overview' },{ key: 'department', label: 'Department' },{ key: 'employee', label: 'Employee' }].map(t => (
          <button key={t.key} onClick={() => setViewTab(t.key)} className={`px-4 sm:px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${viewTab === t.key ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {viewTab === 'company' && companyPayroll && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            <StatCard title="Total Employees" value={companyPayroll.totalEmployees} icon={Users} className="border-l-4 border-l-primary" />
            <StatCard title="Gross Salary" value={`৳${companyPayroll.totalGrossSalary?.toLocaleString()}`} icon={TrendingUp} className="border-l-4 border-l-green-500" />
            <StatCard title="Total Deductions" value={`৳${companyPayroll.totalDeductions?.toLocaleString()}`} icon={Building2} className="border-l-4 border-l-red-500" />
            <StatCard title="Net Salary" value={`৳${companyPayroll.totalNetSalary?.toLocaleString()}`} icon={DollarSign} className="border-l-4 border-l-primary" />
          </div>
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h2 className="text-lg font-semibold">Company Payroll — {MONTH_NAMES[month - 1]} {year}</h2>
              <span className={`text-xs px-3 py-1 rounded-full font-medium self-start ${companyPayroll.status === 'PAID' ? 'bg-green-50 text-green-600' : companyPayroll.status === 'PROCESSED' ? 'bg-blue-50 text-blue-600' : 'bg-yellow-50 text-yellow-600'}`}>{companyPayroll.status}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
              <div className="bg-page-bg rounded-lg p-4"><div className="text-sm text-text-secondary mb-1">Gross Salary</div><div className="text-xl font-bold text-green-600">৳{companyPayroll.totalGrossSalary?.toLocaleString()}</div></div>
              <div className="bg-page-bg rounded-lg p-4"><div className="text-sm text-text-secondary mb-1">Total Deductions</div><div className="text-xl font-bold text-red-600">৳{companyPayroll.totalDeductions?.toLocaleString()}</div></div>
              <div className="bg-page-bg rounded-lg p-4"><div className="text-sm text-text-secondary mb-1">Net Salary</div><div className="text-xl font-bold text-primary">৳{companyPayroll.totalNetSalary?.toLocaleString()}</div></div>
            </div>
            {companyPayroll.processedAt && <p className="text-xs text-text-secondary mt-4">Processed on: {new Date(companyPayroll.processedAt).toLocaleString()}</p>}
          </div>
        </div>
      )}

      {viewTab === 'company' && !companyPayroll && <div className="bg-card border border-border rounded-xl p-12 text-center text-text-secondary">No payroll found for {MONTH_NAMES[month - 1]} {year}. Click "Generate Payroll" to create one.</div>}

      {viewTab === 'department' && (
        <div>
          <div className="mb-6"><label className="block text-sm font-medium mb-1">Select Department</label>
            <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)} className="w-full max-w-sm px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary bg-white">
              <option value="">Select Department</option>{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select></div>
          {departmentPayroll ? (
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">{departmentPayroll.department} — {MONTH_NAMES[month - 1]} {year}</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-page-bg rounded-lg p-4 text-center"><div className="text-sm text-text-secondary mb-1">Employees</div><div className="text-xl font-bold">{departmentPayroll.totalEmployees}</div></div>
                <div className="bg-page-bg rounded-lg p-4 text-center"><div className="text-sm text-text-secondary mb-1">Gross Salary</div><div className="text-xl font-bold text-green-600">৳{departmentPayroll.totalGrossSalary?.toLocaleString()}</div></div>
                <div className="bg-page-bg rounded-lg p-4 text-center"><div className="text-sm text-text-secondary mb-1">Deductions</div><div className="text-xl font-bold text-red-600">৳{departmentPayroll.totalDeductions?.toLocaleString()}</div></div>
                <div className="bg-page-bg rounded-lg p-4 text-center"><div className="text-sm text-text-secondary mb-1">Net Salary</div><div className="text-xl font-bold text-primary">৳{departmentPayroll.totalNetSalary?.toLocaleString()}</div></div>
              </div>
            </div>
          ) : selectedDepartment ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-text-secondary">No payroll found for this department in {MONTH_NAMES[month - 1]} {year}.</div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-text-secondary">Select a department to view payroll.</div>
          )}
        </div>
      )}

      {viewTab === 'employee' && (
        <div>
          <div className="mb-6"><label className="block text-sm font-medium mb-1">Select Employee</label>
            <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className="w-full max-w-sm px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary bg-white">
              <option value="">Select Employee</option>{employees.filter(e => !e.isDeleted).map(emp => (<option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>))}
            </select></div>
          {employeePayroll ? (
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                <div><h2 className="text-lg font-semibold">{employeePayroll.employee.firstName} {employeePayroll.employee.lastName}</h2><p className="text-sm text-text-secondary">{employeePayroll.employee.department} — {MONTH_NAMES[month - 1]} {year}</p></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-page-bg rounded-lg p-4">
                  <h3 className="text-sm font-semibold mb-3">Earnings</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Basic Salary</span><span className="font-medium">৳{employeePayroll.payslip.basicSalary?.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>House Rent</span><span className="font-medium">৳{employeePayroll.payslip.houseRent?.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Medical</span><span className="font-medium">৳{employeePayroll.payslip.medical?.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Conveyance</span><span className="font-medium">৳{employeePayroll.payslip.conveyance?.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Allowances</span><span className="font-medium">৳{employeePayroll.payslip.allowances?.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Overtime</span><span className="font-medium">৳{employeePayroll.payslip.overtimeAmount?.toLocaleString()}</span></div>
                    <div className="flex justify-between border-t border-border pt-2"><span className="font-semibold">Total Earnings</span><span className="font-semibold text-green-600">৳{employeePayroll.payslip.grossSalary?.toLocaleString()}</span></div>
                  </div>
                </div>
                <div className="bg-page-bg rounded-lg p-4">
                  <h3 className="text-sm font-semibold mb-3">Deductions</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Unpaid Leave</span><span className="font-medium">৳{employeePayroll.payslip.unpaidLeaveDeduction?.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Other Deductions</span><span className="font-medium">৳{employeePayroll.payslip.otherDeductions?.toLocaleString()}</span></div>
                    <div className="flex justify-between border-t border-border pt-2"><span className="font-semibold">Total Deductions</span><span className="font-semibold text-red-600">৳{employeePayroll.payslip.totalDeductions?.toLocaleString()}</span></div>
                  </div>
                </div>
              </div>
              <div className="mt-6 bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex justify-between items-center"><span className="font-semibold">Net Salary</span><span className="text-2xl font-bold text-primary">৳{employeePayroll.payslip.netSalary?.toLocaleString()}</span></div>
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center text-sm">
                <div className="bg-page-bg rounded-lg p-3"><div className="text-text-secondary">Working Days</div><div className="font-bold">{employeePayroll.payslip.workingDays}</div></div>
                <div className="bg-page-bg rounded-lg p-3"><div className="text-text-secondary">Present</div><div className="font-bold text-green-600">{employeePayroll.payslip.presentDays}</div></div>
                <div className="bg-page-bg rounded-lg p-3"><div className="text-text-secondary">Paid Leave</div><div className="font-bold text-blue-600">{employeePayroll.payslip.paidLeaveDays}</div></div>
                <div className="bg-page-bg rounded-lg p-3"><div className="text-text-secondary">Unpaid Leave</div><div className="font-bold text-red-600">{employeePayroll.payslip.unpaidLeaveDays}</div></div>
              </div>
            </div>
          ) : selectedEmployee ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-text-secondary">No payroll found for this employee in {MONTH_NAMES[month - 1]} {year}.</div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-text-secondary">Select an employee to view their payroll.</div>
          )}
        </div>
      )}
    </div>
  );
}
