import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, Pencil, Trash2, Search, Calendar } from 'lucide-react';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function AdminShift() {
  const [tab, setTab] = useState('shifts');
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [shiftForm, setShiftForm] = useState({ name: '', startTime: '', endTime: '', graceMinutes: 15, weekends: [] });
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [assignDate, setAssignDate] = useState('');
  const [assignMonth, setAssignMonth] = useState(new Date().getMonth() + 1);
  const [assignYear, setAssignYear] = useState(new Date().getFullYear());
  const [assignMode, setAssignMode] = useState('single');
  const [viewEmployee, setViewEmployee] = useState('');
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewAssignments, setViewAssignments] = useState([]);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [editShiftId, setEditShiftId] = useState('');
  const [publicHolidays, setPublicHolidays] = useState([]);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [holidayForm, setHolidayForm] = useState({ name: '', startDate: '', endDate: '' });

  const fetchShifts = () => { api.get('/shifts').then(res => setShifts(res.data.data || [])).catch(() => {}); };
  const fetchEmployees = () => { api.get('/employees').then(res => setEmployees(res.data || [])).catch(() => {}); };
  useEffect(() => { fetchShifts(); fetchEmployees(); fetchPublicHolidays(); }, []);
  const fetchPublicHolidays = () => { api.get('/public-holidays').then(res => setPublicHolidays(res.data.data || [])).catch(() => {}); };

  const handleHolidaySave = async () => { try { if (editingHoliday) await api.patch(`/public-holidays/${editingHoliday._id}`, holidayForm); else await api.post('/public-holidays', holidayForm); setShowHolidayModal(false); setEditingHoliday(null); setHolidayForm({ name: '', startDate: '', endDate: '' }); fetchPublicHolidays(); } catch (err) { alert(err.response?.data?.error || 'Failed to save'); } };
  const handleHolidayDelete = async (id) => { if (!confirm('Delete this holiday?')) return; try { await api.delete(`/public-holidays/${id}`); fetchPublicHolidays(); } catch (err) { alert(err.response?.data?.error || 'Failed'); } };
  const handleShiftSave = async () => { try { if (editingShift) await api.patch(`/update-shift/${editingShift._id}`, shiftForm); else await api.post('/create-shift', shiftForm); setShowShiftModal(false); setEditingShift(null); setShiftForm({ name: '', startTime: '', endTime: '', graceMinutes: 15, weekends: [] }); fetchShifts(); } catch (err) { alert(err.response?.data?.error || 'Failed'); } };
  const handleShiftDelete = async (id) => { if (!confirm('Deactivate this shift?')) return; try { await api.delete(`/delete-shift/${id}`); fetchShifts(); } catch (err) { alert(err.response?.data?.error || 'Failed'); } };
  const handleShiftActivate = async (id) => { try { await api.patch(`/shift/${id}/activate`); fetchShifts(); } catch (err) { alert(err.response?.data?.error || 'Failed'); } };

  const handleAssign = async () => {
    try {
      if (assignMode === 'single') { if (!selectedEmployee || !selectedShift || !assignDate) { alert('Please select employee, shift and date'); return; } await api.post('/assign-shift', { employeeId: selectedEmployee, shiftId: selectedShift, date: assignDate }); alert('Shift assigned successfully'); }
      else { if (!selectedEmployee || !selectedShift) { alert('Please select employee and shift'); return; } const res = await api.post('/assign-shift-month', { employeeId: selectedEmployee, shiftId: selectedShift, month: Number(assignMonth), year: Number(assignYear) }); alert(res.data.message); }
      fetchViewAssignments();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const fetchViewAssignments = () => {
    if (!viewEmployee) { setViewAssignments([]); return; }
    const startDate = new Date(viewYear, viewMonth, 1);
    const endDate = new Date(viewYear, viewMonth + 1, 0);
    api.get(`/employee-roster/${viewEmployee}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`).then(res => setViewAssignments(res.data.data || [])).catch(() => setViewAssignments([]));
  };
  useEffect(() => { fetchViewAssignments(); }, [viewEmployee, viewMonth, viewYear]);

  const handleUpdateAssignment = async () => { if (!editingAssignment || !editShiftId) return; try { await api.patch(`/update-shift-assignment/${editingAssignment._id}`, { shiftId: editShiftId }); setEditingAssignment(null); setEditShiftId(''); fetchViewAssignments(); } catch (err) { alert(err.response?.data?.error || 'Failed'); } };
  const handleDeleteAssignment = async (id) => { if (!confirm('Remove this assignment?')) return; try { await api.delete(`/delete-shift-assignment/${id}`); fetchViewAssignments(); } catch (err) { alert(err.response?.data?.error || 'Failed'); } };

  const prevViewMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextViewMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };
  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfWeek = (m, y) => new Date(y, m, 1).getDay();

  const shiftMap = {};
  viewAssignments.forEach(s => { const d = new Date(s.date); shiftMap[d.getDate()] = s; });
  const filteredShifts = shifts.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const activeShifts = shifts.filter(s => s.isActive);

  return (
    <div>
      <h1 className="text-2xl font-bold">Shift Management</h1>
      <p className="text-text-secondary text-sm mb-6">Manage shifts and assign them to employees</p>

      <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
        {[{ key: 'shifts', label: 'Shifts' },{ key: 'assign', label: 'Assign Shift' },{ key: 'view', label: 'View Assigned' },{ key: 'holidays', label: 'Public Holidays' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 sm:px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'shifts' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-sm"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" /><input type="text" placeholder="Search shifts..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary" /></div>
            <button onClick={() => { setEditingShift(null); setShiftForm({ name: '', startTime: '', endTime: '', graceMinutes: 15, weekends: [] }); setShowShiftModal(true); }} className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"><Plus size={18} /> Add Shift</button>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead><tr className="border-b border-border bg-page-bg/50">
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">Name</th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">Start</th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">End</th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">Grace</th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">Weekends</th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">Status</th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">Actions</th>
                </tr></thead>
                <tbody>{filteredShifts.map(shift => (
                  <tr key={shift._id} className="border-b border-border last:border-0">
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium">{shift.name}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-text-secondary">{shift.startTime}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-text-secondary">{shift.endTime}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-text-secondary">{shift.graceMinutes}m</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-text-secondary">{(shift.weekends||[]).length > 0 ? shift.weekends.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ') : 'None'}</td>
                    <td className="px-4 sm:px-6 py-4"><span className={`text-xs px-3 py-1 rounded-full font-medium ${shift.isActive ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>{shift.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-4 sm:px-6 py-4"><div className="flex gap-2">
                      <button onClick={() => { setEditingShift(shift); setShiftForm({ name: shift.name, startTime: shift.startTime, endTime: shift.endTime, graceMinutes: shift.graceMinutes, weekends: shift.weekends||[] }); setShowShiftModal(true); }} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100">Edit</button>
                      {shift.isActive ? <button onClick={() => handleShiftDelete(shift._id)} className="text-xs bg-amber-50 text-amber-600 px-3 py-1 rounded-full hover:bg-red-100">Deactivate</button> : <button onClick={() => handleShiftActivate(shift._id)} className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-full hover:bg-green-100">Activate</button>}
                    </div></td>
                  </tr>
                ))}{filteredShifts.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-text-secondary">No shifts found</td></tr>}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'assign' && (
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">Assign Shift to Employee</h2>
          <div className="flex gap-3 mb-6">
            <button onClick={() => setAssignMode('single')} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${assignMode === 'single' ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary hover:bg-page-bg'}`}>Single Day</button>
            <button onClick={() => setAssignMode('month')} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${assignMode === 'month' ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary hover:bg-page-bg'}`}>Whole Month</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div><label className="block text-sm font-medium mb-1">Employee</label><select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary bg-white"><option value="">Select Employee</option>{employees.filter(e => !e.isDeleted).map(emp => (<option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>))}</select></div>
            <div><label className="block text-sm font-medium mb-1">Shift</label><select value={selectedShift} onChange={e => setSelectedShift(e.target.value)} className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary bg-white"><option value="">Select Shift</option>{activeShifts.map(s => (<option key={s._id} value={s._id}>{s.name} ({s.startTime} - {s.endTime})</option>))}</select></div>
            {assignMode === 'single' ? (
              <div><label className="block text-sm font-medium mb-1">Date</label><input type="date" value={assignDate} onChange={e => setAssignDate(e.target.value)} className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary" /></div>
            ) : (<>
              <div><label className="block text-sm font-medium mb-1">Month</label><select value={assignMonth} onChange={e => setAssignMonth(Number(e.target.value))} className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary bg-white">{MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Year</label><select value={assignYear} onChange={e => setAssignYear(Number(e.target.value))} className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary bg-white">{Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (<option key={y} value={y}>{y}</option>))}</select></div>
            </>)}
          </div>
          <button onClick={handleAssign} className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">{assignMode === 'single' ? 'Assign Shift' : 'Assign for Month'}</button>
        </div>
      )}

      {tab === 'view' && (
        <div>
          <div className="mb-6"><label className="block text-sm font-medium mb-1">Select Employee</label><select value={viewEmployee} onChange={e => setViewEmployee(e.target.value)} className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary bg-white"><option value="">Select Employee</option>{employees.map(emp => (<option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>))}</select></div>
          {viewEmployee && (
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <button onClick={prevViewMonth} className="px-3 sm:px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-page-bg transition-colors">&larr; Prev</button>
                <h2 className="text-base sm:text-lg font-bold">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
                <button onClick={nextViewMonth} className="px-3 sm:px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-page-bg transition-colors">Next &rarr;</button>
              </div>
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => (<div key={day} className="bg-page-bg px-1 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-semibold text-text-secondary uppercase">{day}</div>))}
                {Array.from({ length: getFirstDayOfWeek(viewMonth, viewYear) }).map((_, i) => (<div key={`empty-${i}`} className="bg-card min-h-[50px] sm:min-h-[80px]" />))}
                {Array.from({ length: getDaysInMonth(viewMonth, viewYear) }).map((_, i) => {
                  const day = i + 1; const assignment = shiftMap[day]; const today = new Date(); const isToday = today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear; const dayOfWeek = new Date(viewYear, viewMonth, day).getDay(); const isWeekend = assignment?.shift?.weekends?.includes(dayOfWeek);
                  return (
                    <div key={day} className={`min-h-[50px] sm:min-h-[80px] p-1 sm:p-2 ${isWeekend ? 'bg-amber-50' : 'bg-card'} ${isToday ? 'ring-2 ring-primary ring-inset' : ''}`}>
                      <div className={`text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${isToday ? 'text-primary font-bold' : isWeekend ? 'text-amber-600' : 'text-text-primary'}`}>{day}{isWeekend && <span className="ml-0.5 text-[9px] sm:text-[10px] text-amber-400 font-normal">W</span>}</div>
                      {isWeekend ? <div className="text-[9px] sm:text-[11px] text-amber-500 font-medium">Weekend</div> : assignment && assignment.shift ? <div className="bg-primary/10 text-primary rounded px-1 py-0.5 text-[9px] sm:text-[11px] font-medium leading-tight"><div>{assignment.shift.name}</div><div className="hidden sm:block">{assignment.shift.startTime} - {assignment.shift.endTime}</div></div> : <div className="text-[9px] sm:text-[11px] text-text-secondary">No shift</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {viewEmployee && viewAssignments.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-border"><h2 className="font-semibold">Shift Schedule</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px]">
                  <thead><tr className="border-b border-border bg-page-bg/50">
                    <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-3">Date</th>
                    <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-3">Shift</th>
                    <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-3">Time</th>
                    <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-3">Actions</th>
                  </tr></thead>
                  <tbody>{viewAssignments.map(s => { const dayOfWeek = new Date(s.date).getDay(); const isWeekend = s.shift?.weekends?.includes(dayOfWeek); return (
                    <tr key={s._id} className={`border-b border-border last:border-0 ${isWeekend ? 'bg-amber-50' : ''}`}>
                      <td className="px-4 sm:px-6 py-4 text-sm">{new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}{isWeekend && <span className="ml-2 text-xs text-amber-500 font-medium">Weekend</span>}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm font-medium">{editingAssignment?._id === s._id ? <select value={editShiftId} onChange={e => setEditShiftId(e.target.value)} className="px-2 py-1 border border-border rounded text-sm focus:outline-none focus:border-primary">{activeShifts.map(sh => (<option key={sh._id} value={sh._id}>{sh.name}</option>))}</select> : s.shift?.name}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-text-secondary">{s.shift?.startTime} - {s.shift?.endTime}</td>
                      <td className="px-4 sm:px-6 py-4"><div className="flex gap-2">{editingAssignment?._id === s._id ? <><button onClick={handleUpdateAssignment} className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-full hover:bg-green-100">Save</button><button onClick={() => { setEditingAssignment(null); setEditShiftId(''); }} className="text-xs bg-gray-50 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-100">Cancel</button></> : <><button onClick={() => { setEditingAssignment(s); setEditShiftId(s.shift?._id||''); }} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100">Edit</button><button onClick={() => handleDeleteAssignment(s._id)} className="text-xs bg-amber-50 text-amber-600 px-3 py-1 rounded-full hover:bg-red-100">Remove</button></>}</div></td>
                    </tr>
                  );})}</tbody>
                </table>
              </div>
            </div>
          )}
          {viewEmployee && viewAssignments.length === 0 && <div className="bg-card border border-border rounded-xl p-12 text-center text-text-secondary">No shifts assigned for this month.</div>}
        </div>
      )}

      {showShiftModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowShiftModal(false)}></div>
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editingShift ? 'Edit Shift' : 'Add Shift'}</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Shift Name</label><input value={shiftForm.name} onChange={e => setShiftForm({ ...shiftForm, name: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary" placeholder="e.g. Morning Shift" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Start Time</label><input type="time" value={shiftForm.startTime} onChange={e => setShiftForm({ ...shiftForm, startTime: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary" /></div>
                <div><label className="block text-sm font-medium mb-1">End Time</label><input type="time" value={shiftForm.endTime} onChange={e => setShiftForm({ ...shiftForm, endTime: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Grace Period (minutes)</label><input type="number" value={shiftForm.graceMinutes} onChange={e => setShiftForm({ ...shiftForm, graceMinutes: Number(e.target.value) })} className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary" min="0" /></div>
              <div><label className="block text-sm font-medium mb-2">Weekends</label><div className="flex flex-wrap gap-2">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day, i) => (<button key={i} type="button" onClick={() => { const weekends = shiftForm.weekends.includes(i) ? shiftForm.weekends.filter(d => d !== i) : [...shiftForm.weekends, i]; setShiftForm({ ...shiftForm, weekends }); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${shiftForm.weekends.includes(i) ? 'bg-amber-50 border-red-300 text-amber-600' : 'border-border text-text-secondary hover:bg-page-bg'}`}>{day}</button>))}</div><p className="text-xs text-text-secondary mt-1">Select weekend days</p></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowShiftModal(false)} className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-page-bg transition-colors">Cancel</button>
              <button onClick={handleShiftSave} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors">{editingShift ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'holidays' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <p className="text-text-secondary text-sm">Declare public holidays</p>
            <button onClick={() => { setEditingHoliday(null); setHolidayForm({ name: '', startDate: '', endDate: '' }); setShowHolidayModal(true); }} className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"><Plus size={18} /> Add Public Holiday</button>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead><tr className="border-b border-border bg-page-bg/50">
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">Name</th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">Start Date</th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">End Date</th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">Duration</th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">Actions</th>
                </tr></thead>
                <tbody>{publicHolidays.map(holiday => { const start = new Date(holiday.startDate); const end = new Date(holiday.endDate); const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1; return (
                  <tr key={holiday._id} className="border-b border-border last:border-0">
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium">{holiday.name}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-text-secondary">{start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-text-secondary">{end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-text-secondary">{diffDays === 1 ? '1 day' : `${diffDays} days`}</td>
                    <td className="px-4 sm:px-6 py-4"><div className="flex gap-2">
                      <button onClick={() => { setEditingHoliday(holiday); setHolidayForm({ name: holiday.name, startDate: holiday.startDate.split('T')[0], endDate: holiday.endDate.split('T')[0] }); setShowHolidayModal(true); }} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100">Edit</button>
                      <button onClick={() => handleHolidayDelete(holiday._id)} className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full hover:bg-red-100">Delete</button>
                    </div></td>
                  </tr>
                );})}{publicHolidays.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-text-secondary">No public holidays declared</td></tr>}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showHolidayModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowHolidayModal(false)}></div>
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold mb-4">{editingHoliday ? 'Edit Public Holiday' : 'Add Public Holiday'}</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Holiday Name</label><input value={holidayForm.name} onChange={e => setHolidayForm({ ...holidayForm, name: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary" placeholder="e.g. Independence Day" /></div>
              <div><label className="block text-sm font-medium mb-1">Start Date</label><input type="date" value={holidayForm.startDate} onChange={e => setHolidayForm({ ...holidayForm, startDate: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary" /></div>
              <div><label className="block text-sm font-medium mb-1">End Date</label><input type="date" value={holidayForm.endDate} onChange={e => setHolidayForm({ ...holidayForm, endDate: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary" /><p className="text-xs text-text-secondary mt-1">Same date for single-day holiday</p></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowHolidayModal(false)} className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-page-bg transition-colors">Cancel</button>
              <button onClick={handleHolidaySave} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors">{editingHoliday ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
