import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { CalendarDays, Users, CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const DEPARTMENTS = [
  "Administration","Human Resources","Finance & Accounts","Sales","Marketing",
  "Customer Support","Operations","Supply Chain","Procurement","Information Technology",
  "Software Development","Legal","Internal Audit","Design","Business Intelligence",
];

export default function AdminAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState({ totalEmployees: 0, totalRecords: 0, presentDays: 0, lateDays: 0, absentDays: 0, avgHours: 0 });
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [department, setDepartment] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [search, setSearch] = useState('');
  const [employeeList, setEmployeeList] = useState([]);

  const fetchAttendance = () => {
    const params = new URLSearchParams({ month, year });
    if (department) params.append('department', department);
    if (employeeId) params.append('employeeId', employeeId);
    api.get(`/admin/attendance?${params.toString()}`).then(res => {
      setAttendance(res.data.data || []);
      setEmployees(res.data.employees || []);
      setSummary(res.data.summary || { totalEmployees: 0, totalRecords: 0, presentDays: 0, lateDays: 0, absentDays: 0, avgHours: 0 });
    }).catch(() => {});
  };

  useEffect(() => { fetchAttendance(); }, [month, year, department, employeeId]);


  useEffect(() => {
    if (department) {
      api.get(`/employees?department=${department}&limit=100`).then(res => {
      const list = Array.isArray(res.data) ? res.data : (res.data.data || res.data.employees || []);
        setEmployeeList(list.filter(e => !e.isDeleted));
      }).catch(() => setEmployeeList([]));
    } else {
      api.get('/employees?limit=100').then(res => {
      const list = Array.isArray(res.data) ? res.data : (res.data.data || res.data.employees || []);
        setEmployeeList(list.filter(e => !e.isDeleted));
      }).catch(() => setEmployeeList([]));
    }
  }, [department]);

  const filtered = attendance.filter(a => {
    if (!search) return true;
    const name = `${a.employeeId?.firstName || ''} ${a.employeeId?.lastName || ''}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });


  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 5; y--) years.push(y);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-text-secondary text-sm">View and manage employee attendance records</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-6">
        <StatCard title="Total Employees" value={summary.totalEmployees} icon={Users} className="border-l-4 border-l-blue-500" />
        <StatCard title="Days Present" value={summary.presentDays} icon={CheckCircle} className="border-l-4 border-l-green-500" />
        <StatCard title="Late Arrivals" value={summary.lateDays} icon={Clock} className="border-l-4 border-l-yellow-500" />
        <StatCard title="Days Absent" value={summary.absentDays} icon={AlertCircle} className="border-l-4 border-l-red-500" />
        <StatCard title="Avg. Work Hours" value={`${summary.avgHours} Hrs`} icon={TrendingUp} className="border-l-4 border-l-primary" />
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6">
        <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="px-3 py-2 border border-border rounded-lg bg-card text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
          {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="px-3 py-2 border border-border rounded-lg bg-card text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={department} onChange={e => { setDepartment(e.target.value); setEmployeeId(''); }} className="px-3 py-2 border border-border rounded-lg bg-card text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="px-3 py-2 border border-border rounded-lg bg-card text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">All Employees</option>
          {employeeList.map(e => <option key={e._id} value={e._id}>{e.firstName} {e.lastName}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <input type="text" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-card text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-border bg-page-bg/50">
          <h2 className="text-sm font-semibold">Attendance — {MONTH_NAMES[month - 1]} {year}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-page-bg/50">
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-3">Employee</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-3">Department</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-3">Date</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-3">Check In</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-3">Check Out</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-3">Working Hours</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-3">Day Type</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
  <tr
    key={a._id}
    className={`border-b border-border last:border-0 ${
      a.status === 'ABSENT'
        ? 'bg-red-50/50'
        : a.status === 'WEEKEND'
        ? 'bg-amber-50/50'
        : ''
    }`}
  >
    <td className="px-4 sm:px-6 py-4 text-sm font-medium">
      {a.employeeId?.firstName} {a.employeeId?.lastName}
    </td>

    <td className="px-4 sm:px-6 py-4 text-sm text-text-secondary">
      {a.employeeId?.department || '-'}
    </td>

    <td className="px-4 sm:px-6 py-4 text-sm text-text-secondary">
      {new Date(a.date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}
    </td>

    <td className="px-4 sm:px-6 py-4 text-sm">
      {a.checkIn
        ? new Date(a.checkIn).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        : '-'}
    </td>

    <td className="px-4 sm:px-6 py-4 text-sm">
      {a.checkOut
        ? new Date(a.checkOut).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        : '-'}
    </td>

    <td className="px-4 sm:px-6 py-4 text-sm">
      {a.workingHours
        ? `${Math.floor(a.workingHours)}h ${Math.round(
            (a.workingHours % 1) * 60
          )}m`
        : a.checkIn && !a.checkOut
        ? 'Ongoing'
        : '-'}
    </td>

    <td className="px-4 sm:px-6 py-4">
      {a.dayType ? (
        <Badge text={a.dayType} />
      ) : a.checkIn && !a.checkOut ? (
        <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
          In Progress
        </span>
      ) : (
        <span className="text-xs text-text-secondary">-</span>
      )}
    </td>

    <td className="px-4 sm:px-6 py-4">
      <Badge text={a.status} />
    </td>
  </tr>
))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-text-secondary">No attendance records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
