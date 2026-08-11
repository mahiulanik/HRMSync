import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import AddEmployeeModal from './AddEmployeeModal';
import { Plus, Search, Eye, EyeOff } from 'lucide-react';

const DEPARTMENTS = [
  'Administration','Human Resources','Finance & Accounts','Sales','Marketing',
  'Customer Support','Operations','Supply Chain','Procurement','Information Technology',
  'Software Development','Legal','Internal Audit','Design','Business Intelligence'
];

export default function AdminEmployees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

  const fetchEmployees = () => {
    const params = new URLSearchParams();
    if (dept) params.append('department', dept);
    if (showDeleted) params.append('onlyDeleted', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';
    api.get(`/employees${query}`).then(res => setEmployees(res.data)).catch(() => {});
  };

  useEffect(() => { fetchEmployees(); }, [dept, showDeleted]);

  const filtered = employees.filter(emp =>
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-text-secondary text-sm">Manage your team members</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
          <Plus size={18} /> Add Employee
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary"
          />
        </div>
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary bg-white">
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <button
          onClick={() => setShowDeleted(!showDeleted)}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${showDeleted ? 'bg-red-50 border-red-300 text-red-600' : 'border-border text-text-secondary hover:bg-page-bg'}`}
        >
          {showDeleted ? <EyeOff size={16} /> : <Eye size={16} />}
          {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filtered.map(emp => (
          <div key={emp._id} onClick={() => navigate(`/admin/employees/${emp._id}`)} className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:border-primary/30 transition-all">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 flex flex-col items-center">
              <div className="flex gap-2 mb-4">
                <span className="bg-white/80 text-text-primary text-xs px-3 py-1 rounded-full font-medium">{emp.department}</span>
                {emp.isDeleted && <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium">DELETED</span>}
              </div>
              <Avatar name={`${emp.firstName} ${emp.lastName}`} profilePic={emp.profilePic} size="lg" />
            </div>
            <div className="p-4">
              <div className="font-semibold">{emp.firstName} {emp.lastName}</div>
              <div className="text-sm text-text-secondary">{emp.position}</div>
            </div>
          </div>
        ))}
      </div>

      <AddEmployeeModal isOpen={showAdd} onClose={() => setShowAdd(false)} onSuccess={fetchEmployees} />
    </div>
  );
}
