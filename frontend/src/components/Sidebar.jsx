import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { LayoutDashboard, Users, FileText, DollarSign, Settings, LogOut, User, Clock, Receipt, CalendarDays, Menu, X } from 'lucide-react';

const adminNav = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/employees', icon: Users, label: 'Employees' },
  { to: '/admin/attendance', icon: CalendarDays, label: 'Attendance' },
  { to: '/admin/leave', icon: FileText, label: 'Leave' },
  { to: '/admin/shift', icon: Clock, label: 'Shift' },
  { to: '/admin/payroll', icon: DollarSign, label: 'Payroll' },
  { to: '/admin/payslips', icon: Receipt, label: 'Payslips' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

const employeeNav = [
  { to: '/employee/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employee/attendance', icon: LayoutDashboard, label: 'Attendance' },
  { to: '/employee/leave', icon: FileText, label: 'Leave' },
  { to: '/employee/shift', icon: Clock, label: 'Shift' },
  { to: '/employee/payslips', icon: DollarSign, label: 'Payslips' },
  { to: '/employee/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ role, isOpen, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = role === 'ADMIN' ? adminNav : employeeNav;
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get('/profile').then(res => setProfile(res.data)).catch(() => {});
  }, []);

  const firstName = profile?.firstName || (role === 'ADMIN' ? 'Admin' : 'Employee');
  const initials = firstName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleNavClick = () => {
    if (window.innerWidth < 1024) onToggle();
  };

  return (
    <>
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-[60] bg-sidebar text-white p-2 rounded-lg shadow-lg"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onToggle}
        />
      )}

      <aside className={`fixed left-0 top-0 h-full w-[250px] bg-sidebar text-white flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 flex items-center gap-3">
          <User size={24} />
          <div>
            <div className="font-bold text-sm leading-tight">Employee MS</div>
            <div className="text-xs text-gray-400">Management System</div>
          </div>
        </div>

        <div className="px-4 mb-4">
          <div className="bg-sidebar-light rounded-lg p-3 flex items-center gap-3">
            {profile?.profilePic ? (
              <img src={profile.profilePic} alt="Profile" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/30 flex items-center justify-center text-sm font-semibold text-primary">
                {initials}
              </div>
            )}
            <div>
              <div className="text-sm font-medium">{firstName}</div>
              <div className="text-xs text-gray-400">{role === 'ADMIN' ? 'Administrator' : 'Employee'}</div>
            </div>
          </div>
        </div>

        <div className="px-4 mb-2">
          <div className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">Navigation</div>
        </div>

        <nav className="flex-1 px-2">
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm mb-0.5 transition-colors ${
                  isActive
                    ? 'bg-nav-active text-primary border-l-[3px] border-primary font-medium'
                    : 'text-gray-300 hover:bg-sidebar-light'
                }`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-white w-full rounded-lg hover:bg-sidebar-light transition-colors">
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
