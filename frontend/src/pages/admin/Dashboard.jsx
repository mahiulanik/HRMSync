import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import {
  Users,
  UserCheck,
  Clock,
  FileText,
  Percent,
  DollarSign,
  Timer,
  CalendarOff,
  Calendar,
  TrendingUp,
  Building2,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const LEAVE_COLORS = {
  Pending: "#f59e0b",
  Approved: "#10b981",
  Rejected: "#f87171",
};

const ATTENDANCE_COLORS = {
  Present: "#10b981",
  Late: "#f59e0b",
  Absent: "#f87171",
};

function StatCard({ title, value, icon: Icon, color = "primary", subtitle }) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-lg ${colorMap[color]} flex items-center justify-center shrink-0`}
      >
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-text-secondary font-medium uppercase tracking-wide">
          {title}
        </div>
        <div className="text-2xl font-bold mt-0.5">{value}</div>
        {subtitle && (
          <div className="text-[11px] text-text-secondary mt-0.5">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, children, className = "" }) {
  return (
    <div className={`bg-card border border-border rounded-xl ${className}`}>
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [chartView, setChartView] = useState("7days");
  const [adminName, setAdminName] = useState("Admin");
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => setStats(res.data))
      .catch(() => {});
    api
      .get("/profile")
      .then((res) => setAdminName(res.data.data?.firstName || "Admin"))
      .catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary text-sm">Loading dashboard...</div>
      </div>
    );
  }

  const attendanceChartData =
    chartView === "7days"
      ? (stats.attendanceLast7Days || []).map((d) => ({
          name: new Date(d._id).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
          Present: d.present,
          Late: d.late,
          Absent: d.absent,
        }))
      : (stats.attendanceLast30Days || []).map((d) => ({
          name: new Date(d._id).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          Present: d.present,
          Late: d.late,
          Absent: d.absent,
        }));

  const departmentData = (stats.departmentOverview || []).map((d) => ({
    name: d.department,
    rate: d.attendanceRate,
    employees: d.totalEmployees,
    present: d.present,
    late: d.late,
    absent: d.absent,
  }));

  const leavePieData = [
    { name: "Pending", value: stats.leaveRequests?.pending || 0 },
    { name: "Approved", value: stats.leaveRequests?.approved || 0 },
    { name: "Rejected", value: stats.leaveRequests?.rejected || 0 },
  ].filter((d) => d.value > 0);

  const todayAttendancePie = [
    { name: "Present", value: stats.todayPresent || 0 },
    { name: "Late", value: stats.todayLate || 0 },
    { name: "Absent", value: stats.todayAbsent || 0 },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-text-secondary text-sm mb-6">
        Welcome back, {adminName} — here's your overview
      </p>

      {/* Row 1: Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees ?? 0}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Present Today"
          value={stats.todayPresent ?? 0}
          icon={UserCheck}
          color="success"
        />
        <StatCard
          title="Late Today"
          value={stats.todayLate ?? 0}
          icon={Clock}
          color="warning"
        />
        <StatCard
          title="Pending Leaves"
          value={stats.pendingLeaves ?? 0}
          icon={FileText}
          color="danger"
        />
      </div>

      {/* Row 2: Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Attendance Rate"
          value={`${stats.attendanceRate ?? 0}%`}
          icon={Percent}
          color="success"
          subtitle="Today"
        />
        <StatCard
          title="Payroll This Month"
          value={
            stats.payrollThisMonth
              ? `৳${stats.payrollThisMonth.grossSalary?.toLocaleString() || 0}`
              : "—"
          }
          icon={DollarSign}
          color="primary"
          subtitle={stats.payrollThisMonth?.status || "No payroll"}
        />
        <StatCard
          title="Overtime"
          value={`${stats.overtimeHours ?? 0}h`}
          icon={Timer}
          color="warning"
          subtitle="Today"
        />
        <StatCard
          title="On Leave Today"
          value={stats.onLeaveToday ?? 0}
          icon={CalendarOff}
          color="danger"
          subtitle="Approved leaves"
        />
      </div>

      {/* Attendance Overview Chart */}
      <SectionCard title="Attendance Overview" className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setChartView("7days")}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
              chartView === "7days"
                ? "bg-primary text-white"
                : "bg-page-bg text-text-secondary hover:bg-primary/10"
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setChartView("30days")}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
              chartView === "30days"
                ? "bg-primary text-white"
                : "bg-page-bg text-text-secondary hover:bg-primary/10"
            }`}
          >
            30 Days
          </button>
        </div>
        {attendanceChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={attendanceChartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Absent" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-text-secondary text-sm">
            No attendance data available
          </div>
        )}
      </SectionCard>

      {/* Department Overview */}
      <SectionCard title="Department Overview" className="mb-6">
        {departmentData.length > 0 ? (
          <div className="space-y-5">
            {departmentData.map((dept) => (
              <div key={dept.name} className="p-3 rounded-lg bg-page-bg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 size={16} className="text-primary" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold">{dept.name}</span>
                      <div className="text-[11px] text-text-secondary">
                        {dept.employees} employees
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-bold ${dept.rate >= 90 ? "text-success" : dept.rate >= 70 ? "text-warning" : "text-danger"}`}
                  >
                    {dept.rate}%
                  </span>
                </div>
                <div className="w-full h-2 bg-white rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      dept.rate >= 90
                        ? "bg-success"
                        : dept.rate >= 70
                          ? "bg-warning"
                          : "bg-danger"
                    }`}
                    style={{ width: `${dept.rate}%` }}
                  />
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success" />{" "}
                    Present: {dept.present}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-warning" /> Late:{" "}
                    {dept.late}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-danger" /> Absent:{" "}
                    {dept.absent}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-text-secondary text-sm py-8">
            No department data available
          </div>
        )}
      </SectionCard>

      {/* Leave Requests & Today's Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SectionCard title="Leave Requests">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-page-bg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-warning" />
                <span className="text-sm font-medium">Pending</span>
              </div>
              <span className="text-lg font-bold">
                {stats.leaveRequests?.pending || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-page-bg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-sm font-medium">Approved</span>
              </div>
              <span className="text-lg font-bold">
                {stats.leaveRequests?.approved || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-page-bg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-danger" />
                <span className="text-sm font-medium">Rejected</span>
              </div>
              <span className="text-lg font-bold">
                {stats.leaveRequests?.rejected || 0}
              </span>
            </div>
          </div>
          {leavePieData.length > 0 && (
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={leavePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    dataKey="value"
                    stroke="none"
                  >
                    {leavePieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={LEAVE_COLORS[entry.name]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Today's Attendance">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-page-bg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-sm font-medium">Present</span>
              </div>
              <span className="text-lg font-bold">
                {stats.todayPresent || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-page-bg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-warning" />
                <span className="text-sm font-medium">Late</span>
              </div>
              <span className="text-lg font-bold">{stats.todayLate || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-page-bg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-danger" />
                <span className="text-sm font-medium">Absent</span>
              </div>
              <span className="text-lg font-bold">
                {stats.todayAbsent || 0}
              </span>
            </div>
          </div>
          {todayAttendancePie.length > 0 && (
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={todayAttendancePie}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    dataKey="value"
                    stroke="none"
                  >
                    {todayAttendancePie.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={ATTENDANCE_COLORS[entry.name]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Payroll Overview & Employee Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SectionCard title="Payroll Overview">
          {stats.payrollThisMonth ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-page-bg">
                <span className="text-sm text-text-secondary">
                  Gross Salary
                </span>
                <span className="text-sm font-bold">
                  ৳{stats.payrollThisMonth.grossSalary?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-page-bg">
                <span className="text-sm text-text-secondary">Deductions</span>
                <span className="text-sm font-bold text-danger">
                  - ৳{stats.payrollThisMonth.deductions?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-sm font-semibold">Net Salary</span>
                <span className="text-sm font-bold text-primary">
                  ৳{stats.payrollThisMonth.netSalary?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-page-bg">
                <span className="text-sm text-text-secondary">Status</span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    stats.payrollThisMonth.status === "PAID"
                      ? "bg-success/10 text-success"
                      : stats.payrollThisMonth.status === "PROCESSED"
                        ? "bg-primary/10 text-primary"
                        : "bg-warning/10 text-warning"
                  }`}
                >
                  {stats.payrollThisMonth.status}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center text-text-secondary text-sm py-8">
              No payroll processed this month
            </div>
          )}
        </SectionCard>

        <SectionCard title="Employee Growth">
          {stats.employeeGrowth?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={stats.employeeGrowth}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="employees"
                  stroke="#5046e5"
                  fill="#5046e5"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-text-secondary text-sm py-8">
              No growth data available
            </div>
          )}
          <div className="flex items-center justify-around mt-3 pt-3 border-t border-border">
            <div className="text-center">
              <div className="text-lg font-bold text-success">
                {stats.activeEmployees ?? 0}
              </div>
              <div className="text-[11px] text-text-secondary">Active</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="text-lg font-bold text-danger">
                {stats.inactiveEmployees ?? 0}
              </div>
              <div className="text-[11px] text-text-secondary">Inactive</div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Recent Employees & Upcoming Holidays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Recent Employees">
          {stats.recentEmployees?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentEmployees.map((emp) => (
                <div
                  key={emp._id}
                  onClick={() => navigate(`/admin/employees/${emp._id}`)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-page-bg cursor-pointer transition-colors"
                >
                  {emp.profilePic ? (
                    <img
                      src={emp.profilePic}
                      alt={emp.firstName}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {emp.firstName?.[0]}
                      {emp.lastName?.[0]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">
                      {emp.firstName} {emp.lastName}
                    </div>
                    <div className="text-[11px] text-text-secondary truncate">
                      {emp.position} · {emp.department}
                    </div>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-text-secondary shrink-0"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-text-secondary text-sm py-8">
              No recent employees
            </div>
          )}
        </SectionCard>

        <SectionCard title="Upcoming Holidays">
          {stats.upcomingHolidays?.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingHolidays.map((holiday, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-page-bg"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar size={18} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{holiday.name}</div>
                    <div className="text-[11px] text-text-secondary">
                      {new Date(holiday.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                      {holiday.startDate !== holiday.endDate && (
                        <>
                          {" "}
                          —{" "}
                          {new Date(holiday.endDate).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" },
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-text-secondary text-sm py-8">
              No upcoming holidays
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
