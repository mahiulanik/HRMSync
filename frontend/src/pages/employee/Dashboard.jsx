import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import { CalendarCheck, FileText, DollarSign, ArrowRight } from 'lucide-react';

export default function EmployeeDashboard() {
  const [stats, setStats] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { api.get('/dashboard').then(res => setStats(res.data)).catch(() => {}); }, []);

  const name = stats?.employee ? `${stats.employee.firstName} ${stats.employee.lastName}`.trim() : (user?.name || 'Employee');
  const position = stats?.employee?.position || '';
  const department = stats?.employee?.department || '';

  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome, {name}!</h1>
      <p className="text-text-secondary text-sm mb-6">{position}{department ? ` - ${department}` : ''}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <StatCard title="Days Present" value={stats?.currentMonthAttendance ?? 0} icon={CalendarCheck} className="border-l-4 border-l-primary" />
        <StatCard title="Pending Leaves" value={stats?.pendingLeaves ?? 0} icon={FileText} className="border-l-4 border-l-primary" />
        <StatCard title="Latest Payslip" value={stats?.latestPayslip ? `৳${stats.latestPayslip.netSalary?.toLocaleString()}` : '৳0'} icon={DollarSign} className="border-l-4 border-l-primary" />
      </div>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <button onClick={() => navigate('/employee/attendance')} className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors">Mark Attendance <ArrowRight size={16} /></button>
        <button onClick={() => navigate('/employee/leave')} className="px-6 py-3 border border-border rounded-lg text-sm font-medium hover:bg-white transition-colors">Apply for Leave</button>
      </div>
    </div>
  );
}
