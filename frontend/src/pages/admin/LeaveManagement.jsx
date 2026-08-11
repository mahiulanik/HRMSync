import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import Badge from '../../components/Badge';
import { Search } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function AdminLeave() {
  const [leaves, setLeaves] = useState([]);
  const [search, setSearch] = useState('');
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const fetchLeaves = () => {
    const params = new URLSearchParams();
    params.append('month', selectedMonth);
    params.append('year', selectedYear);
    api.get(`/get-leaves?${params.toString()}`).then(res => setLeaves(res.data.data || [])).catch(() => {});
  };

  useEffect(() => { fetchLeaves(); }, [selectedMonth, selectedYear]);

  const handleStatus = async (id, status) => {
    await api.patch(`/update-leave/${id}`, { status });
    fetchLeaves();
  };

  const filtered = leaves.filter(leave =>
    `${leave.employee?.firstName} ${leave.employee?.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const leaveSummary = useMemo(() => {
    const summary = {};
    leaves.forEach(leave => {
      const name = `${leave.employee?.firstName} ${leave.employee?.lastName}`.trim();
      if (!name) return;
      if (!summary[name]) summary[name] = { total: 0, approved: 0, rejected: 0, pending: 0 };
      summary[name].total++;
      if (leave.status === 'APPROVED') summary[name].approved++;
      else if (leave.status === 'REJECTED') summary[name].rejected++;
      else if (leave.status === 'PENDING') summary[name].pending++;
    });
    return Object.entries(summary).sort((a, b) => b[1].total - a[1].total);
  }, [leaves]);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div>
      <h1 className="text-2xl font-bold">Leave Management</h1>
      <p className="text-text-secondary text-sm mb-6">Manage leave applications</p>

      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <h2 className="text-sm font-semibold mb-3">Leave Summary — {MONTHS[selectedMonth - 1]} {selectedYear}</h2>
        {leaveSummary.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {leaveSummary.map(([name, counts]) => (
              <div key={name} className="bg-page-bg rounded-lg p-3 border border-border">
                <div className="text-sm font-medium mb-1">{name}</div>
                <div className="text-xs text-text-secondary">
                  Total: {counts.total}
                  {counts.approved > 0 && <span className="text-green-600 ml-2">Approved: {counts.approved}</span>}
                  {counts.pending > 0 && <span className="text-yellow-600 ml-2">Pending: {counts.pending}</span>}
                  {counts.rejected > 0 && <span className="text-red-600 ml-2">Rejected: {counts.rejected}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-secondary text-sm">No leaves found for this month.</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input type="text" placeholder="Search by employee name..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary" />
        </div>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary bg-white">
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary bg-white">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-page-bg/50">
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">Employee</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">Type</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">Dates</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">Reason</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(leave => (
                <tr key={leave._id} className="border-b border-border last:border-0">
                  <td className="px-4 sm:px-6 py-4 text-sm font-medium">{leave.employee?.firstName} {leave.employee?.lastName}</td>
                  <td className="px-4 sm:px-6 py-4"><Badge text={leave.type} /></td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-text-secondary">
                    {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} - {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-text-secondary max-w-[200px] truncate" title={leave.reason}>{leave.reason}</td>
                  <td className="px-4 sm:px-6 py-4"><Badge text={leave.status} /></td>
                  <td className="px-4 sm:px-6 py-4">
                    {leave.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleStatus(leave._id, 'APPROVED')} className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-full hover:bg-green-100">Approve</button>
                        <button onClick={() => handleStatus(leave._id, 'REJECTED')} className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full hover:bg-red-100">Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-text-secondary">No leave requests found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
