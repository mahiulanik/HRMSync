import { useState, useEffect } from 'react';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import { CalendarCheck, AlertCircle, Clock, LogOut, LogIn } from 'lucide-react';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function EmployeeAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({ daysPresent: 0, lateArrivals: 0, daysAbsent: 0, avgHours: '0 Hrs' });
  const [clockedIn, setClockedIn] = useState(false);
  const [clocking, setClocking] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchAttendance = () => {
    api.get(`/attendance?month=${month}&year=${year}`).then(res => {
      const data = res.data.data || [];
      setAttendance(data);
      const present = data.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
      const late = data.filter(a => a.status === 'LATE').length;
      const absent = data.filter(a => a.status === 'ABSENT').length;
      const totalHrs = data.reduce((sum, a) => sum + (a.workingHours || 0), 0);
      const workDays = data.filter(a => a.workingHours).length;
      const avg = workDays ? (totalHrs / workDays) : 0;
      setStats({ daysPresent: present, lateArrivals: late, daysAbsent: absent, avgHours: `${avg.toFixed(1)} Hrs` });
      const today = data.find(a => new Date(a.date).toDateString() === new Date().toDateString());
      setClockedIn(today && today.checkIn && !today.checkOut);
    }).catch(() => {});
  };

  useEffect(() => { fetchAttendance(); }, [month, year]);

  const handleClockInOut = async () => {
    setClocking(true); setMessage({ text: '', type: '' });
    try {
      const res = await api.post('/attendance');
      const { type } = res.data;
      if (type === 'CHECK_IN') setMessage({ text: 'Clocked in successfully!', type: 'success' });
      else if (type === 'CHECK_OUT') setMessage({ text: 'Clocked out successfully!', type: 'success' });
      else if (type === 'ALREADY_CHECKED_OUT') setMessage({ text: 'You have already clocked out today.', type: 'info' });
      fetchAttendance();
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    } catch (err) { setMessage({ text: err.response?.data?.error || 'Failed to clock in/out', type: 'error' }); setTimeout(() => setMessage({ text: '', type: '' }), 4000); }
    finally { setClocking(false); }
  };

  const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-';
  const years = []; const currentYear = new Date().getFullYear(); for (let y = currentYear; y >= currentYear - 5; y--) years.push(y);

  return (
    <div>
      <h1 className="text-2xl font-bold">Attendance</h1>
      <p className="text-text-secondary text-sm mb-6">Track your work hours and daily check-ins</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <StatCard title="Days Present" value={stats.daysPresent} icon={CalendarCheck} className="border-l-4 border-l-green-500" />
        <StatCard title="Late Arrivals" value={stats.lateArrivals} icon={AlertCircle} className="border-l-4 border-l-yellow-500" />
        <StatCard title="Days Absent" value={stats.daysAbsent} icon={AlertCircle} className="border-l-4 border-l-red-500" />
        <StatCard title="Avg. Work Hrs" value={stats.avgHours} icon={Clock} className="border-l-4 border-l-primary" />
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6">
        <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="px-3 py-2 border border-border rounded-lg bg-card text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20">{MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="px-3 py-2 border border-border rounded-lg bg-card text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20">{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-border"><h2 className="font-semibold">Attendance — {MONTH_NAMES[month - 1]} {year}</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[550px]">
            <thead><tr className="border-b border-border bg-page-bg/50">
              <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-3">Date</th>
              <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-3">Check In</th>
              <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-3">Check Out</th>
              <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-3">Working Hours</th>
              <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-3">Day Type</th>
              <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-3">Status</th>
            </tr></thead>
            <tbody>{attendance.map(a => (
              <tr key={a._id} className={`border-b border-border last:border-0 ${a.status === 'ABSENT' ? 'bg-red-50/50' : a.status === 'WEEKEND' ? 'bg-amber-50/50' : ''}`}>
                <td className="px-4 sm:px-6 py-4 text-sm">{new Date(a.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td className="px-4 sm:px-6 py-4 text-sm">{formatTime(a.checkIn)}</td>
                <td className="px-4 sm:px-6 py-4 text-sm">{a.checkOut ? formatTime(a.checkOut) : '-'}</td>
                <td className="px-4 sm:px-6 py-4 text-sm">{a.workingHours ? `${Math.floor(a.workingHours)}h ${Math.round((a.workingHours % 1) * 60)}m` : a.checkIn && !a.checkOut ? 'Ongoing' : '-'}</td>
                <td className="px-4 sm:px-6 py-4">{a.dayType ? <Badge text={a.dayType} /> : a.checkIn && !a.checkOut ? <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full">In Progress</span> : <span className="text-xs text-text-secondary">-</span>}</td>
                <td className="px-4 sm:px-6 py-4"><Badge text={a.status} /></td>
              </tr>
            ))}{attendance.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-text-secondary">No attendance records</td></tr>}</tbody>
          </table>
        </div>
      </div>
      {message.text && (
        <div className={`fixed bottom-24 right-4 sm:right-8 px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg z-50 ${message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>{message.text}</div>
      )}
      <button onClick={handleClockInOut} disabled={clocking} className={`fixed bottom-6 right-4 sm:bottom-8 sm:right-8 px-5 sm:px-6 py-3 sm:py-4 rounded-xl flex items-center gap-3 shadow-lg transition-all z-50 disabled:opacity-50 ${clockedIn ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-sidebar hover:bg-sidebar-light text-white'}`}>
        {clockedIn ? <LogOut size={20} /> : <LogIn size={20} />}
        <div className="text-left">
          <div className="font-semibold text-sm text-white">{clocking ? 'Processing...' : (clockedIn ? 'Clock Out' : 'Clock In')}</div>
          <div className={`text-xs ${clockedIn ? 'text-red-100' : 'text-gray-400'}`}>{clockedIn ? 'Click to end your shift' : 'Click to start your shift'}</div>
        </div>
      </button>
    </div>
  );
}
