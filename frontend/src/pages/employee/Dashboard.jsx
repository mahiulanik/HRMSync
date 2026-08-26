import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  Percent, FileText, DollarSign, Gift
} from 'lucide-react';

function StatCard({ title, value, icon: Icon, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg ${colorMap[color]} flex items-center justify-center shrink-0`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-text-secondary font-medium uppercase tracking-wide">{title}</div>
        <div className="text-2xl font-bold mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function SectionCard({ title, children, className = '' }) {
  return (
    <div className={`bg-card border border-border rounded-xl ${className}`}>
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const [stats, setStats] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/dashboard').then(res => setStats(res.data)).catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary text-sm">Loading dashboard...</div>
      </div>
    );
  }

  const name = stats.employee
    ? `${stats.employee.firstName} ${stats.employee.lastName}`.trim()
    : (user?.name || 'Employee');
  const position = stats.employee?.position || '';
  const department = stats.employee?.department || '';

  const today = new Date();
  const year = today.getFullYear();
const month = today.getMonth();
const daysInMonth = new Date(year, month + 1, 0).getDate();
const firstDayOfWeek = new Date(year, month, 1).getDay();

const statusMap = {};
for (const r of (stats.attendanceCalendar || [])) {
  const d = new Date(r.date);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  statusMap[key] = r.status;
}

  const calendarDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push({ day: null, status: null, isWeekend: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month, d).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isFuture = d > today.getDate();
    let status = statusMap[dateKey] || (isFuture ? 'future' : isWeekend ? null : 'ABSENT');
    calendarDays.push({ day: d, status, isWeekend, isFuture });
  }

  const leaveTypes = [
    { key: 'SICK', label: 'Sick', icon: '🏥', color: 'text-danger' },
    { key: 'CASUAL', label: 'Casual', icon: '🌴', color: 'text-primary' },
    { key: 'EARNED', label: 'Earned', icon: '⭐', color: 'text-success' }
  ];

  const statusColors = {
    PRESENT: 'bg-success text-white',
    LATE: 'bg-warning text-white',
    ABSENT: 'bg-danger text-white',
    ON_LEAVE: 'bg-primary text-white',
    future: 'bg-page-bg text-text-secondary'
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Good Evening, {name.split(' ')[0]} 👋</h1>
        <p className="text-text-secondary text-sm mt-1">
          {position}{department ? ` · ${department}` : ''}
        </p>
      </div>

      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Attendance"
          value={`${stats.attendanceRate ?? 0}%`}
          icon={Percent}
          color="success"
        />
        <StatCard
          title="Leave"
          value={`${stats.pendingLeaves ?? 0} Pending`}
          icon={FileText}
          color="warning"
        />
        <StatCard
          title="Net Salary"
          value={stats.latestPayslip ? `৳${stats.latestPayslip.netSalary?.toLocaleString() || 0}` : '৳0'}
          icon={DollarSign}
          color="primary"
        />
      </div>

      {/* Today's Shift */}
      <SectionCard title="🕐 Today's Shift" className="mb-6">
        {stats.todayShift ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-lg font-semibold">{stats.todayShift.name}</div>
              <div className="text-sm text-text-secondary mt-1">
                {stats.todayShift.startTime} → {stats.todayShift.endTime}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                stats.clockedIn
                  ? 'bg-success/10 text-success'
                  : 'bg-page-bg text-text-secondary'
              }`}>
                <div className={`w-2 h-2 rounded-full ${stats.clockedIn ? 'bg-success' : 'bg-text-secondary'}`} />
                {stats.clockedIn ? 'Clocked In' : 'Not Clocked In'}
              </div>
              {stats.workedTime && (
                <div className="text-sm font-semibold text-primary">{stats.workedTime}</div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-text-secondary text-sm py-4">No shift assigned for today</div>
        )}
      </SectionCard>

      {/* Attendance Calendar */}
      <SectionCard title="📅 Attendance Calendar" className="mb-6">
        <div className="flex items-center gap-4 mb-4 text-xs text-text-secondary flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span>Late</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-700" />
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span>Weekend</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[10px] font-medium text-text-secondary py-1">{d}</div>
          ))}
          {calendarDays.map((item, index) => {
            let cellClass = '';
            if (item.day) {
              if (item.status && statusColors[item.status]) {
                cellClass = statusColors[item.status];
              } else if (item.isWeekend) {
                cellClass = 'bg-pink-200 text-text-secondary';
              } else {
                cellClass = 'bg-page-bg text-text-secondary';
              }
            }
            return (
              <div
                key={index}
                className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium ${item.day ? cellClass : ''}`}
              >
                {item.day}
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Salary History & Leave Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SectionCard title="💰 Salary History">
          {stats.salaryHistory?.length > 0 ? (
            <div className="space-y-3">
              {stats.salaryHistory.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-page-bg">
                  <span className="text-sm font-medium">{s.label}</span>
                  <span className="text-sm font-bold">৳{s.netSalary?.toLocaleString() || 0}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-text-secondary text-sm py-8">No salary history</div>
          )}
        </SectionCard>

        <SectionCard title="🏖 Leave Balance">
          <div className="space-y-3">
            {leaveTypes.map(lt => {
              const balance = stats.leaveBalance?.[lt.key] || { used: 0, total: 0 };
              const remaining = balance.total - balance.used;
              return (
                <div key={lt.key} className="p-3 rounded-lg bg-page-bg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{lt.icon} {lt.label}</span>
                    <span className={`text-sm font-bold ${lt.color}`}>{remaining}/{balance.total}</span>
                  </div>
                  <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${balance.total > 0 ? (balance.used / balance.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* Next Holiday */}
      {stats.nextHoliday && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Gift size={22} className="text-primary" />
          </div>
          <div>
            <div className="text-sm text-text-secondary">🎉 Next Holiday</div>
            <div className="text-lg font-bold">{stats.nextHoliday.name}</div>
            <div className="text-xs text-text-secondary mt-0.5">
              {stats.nextHoliday.daysRemaining === 0
                ? 'Today!'
                : `${stats.nextHoliday.daysRemaining} Day${stats.nextHoliday.daysRemaining > 1 ? 's' : ''} Remaining`
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}