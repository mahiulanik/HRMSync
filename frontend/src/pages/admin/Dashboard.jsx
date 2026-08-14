import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import { Users, Building2, CalendarCheck, FileText } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then(res => setStats(res.data)).catch(() => {});
  }, []);

  const name = stats?.employee ? `${stats.employee.firstName} ${stats.employee.lastName}`.trim() : (user?.name || 'Employee');
  const position = stats?.employee?.position || '';
  const department = stats?.employee?.department || '';

  const employees = stats?.recentEmployees || [];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <h1 className="text-2xl font-bold">Welcome, {name}!</h1>
      <p className="text-text-secondary text-sm mb-6">{position}{department ? ` - ${department}` : ''}</p>
      <p className="text-text-secondary text-sm mb-6">Welcome back, Admin — here's your overview</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatCard title="Total Employees" value={stats?.totalEmployees ?? 0} icon={Users} className="border-l-4 border-l-primary" />
        <StatCard title="Departments" value={stats?.totalDepartments ?? 0} icon={Building2} className="border-l-4 border-l-primary" />
        <StatCard title="Today's Attendance" value={stats?.todayAttendance ?? 0} icon={CalendarCheck} className="border-l-4 border-l-primary" />
        <StatCard title="Pending Leaves" value={stats?.pendingLeaves ?? 0} icon={FileText} className="border-l-4 border-l-primary" />
      </div>

      {employees.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Employees</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {employees.map(emp => (
              <div
                key={emp._id}
                onClick={() => navigate(`/admin/employees/${emp._id}`)}
                className="bg-card border border-border rounded-lg px-3 py-3 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  {emp.profilePic ? (
                    <img src={emp.profilePic} alt={emp.firstName} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate leading-tight">{emp.firstName} {emp.lastName}</div>
                    <div className="text-[11px] text-text-secondary truncate">{emp.position}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
