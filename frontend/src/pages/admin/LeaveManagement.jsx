import { useState, useEffect } from "react";
import api from "../../api/axios";
import Badge from "../../components/Badge";
import { Search } from "lucide-react";
import LeaveDetailModal from "./LeaveDetailModal";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function AdminLeave() {
  const [leaves, setLeaves] = useState([]);
  const [search, setSearch] = useState("");
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchLeaves = () => {
    const params = new URLSearchParams();
    params.append("month", selectedMonth);
    params.append("year", selectedYear);
    api
      .get(`/get-leaves?${params.toString()}`)
      .then((res) => setLeaves(res.data.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchLeaves();
  }, [selectedMonth, selectedYear]);

  const filtered = leaves.filter((leave) =>
    `${leave.employee?.firstName} ${leave.employee?.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleStatus = async (id, status) => {
    await api.patch(`/update-leave/${id}`, { status });
    fetchLeaves();
  };

  const handleRowClick = (leave) => {
    setSelectedLeave(leave);
    setShowDetail(true);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Leave Management</h1>
      <p className="text-text-secondary text-sm mb-6">
        Manage leave applications
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            type="text"
            placeholder="Search by employee name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary bg-white"
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary bg-white"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-page-bg/50">
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">
                  Employee
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">
                  Type
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">
                  Dates
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">
                  Reason
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 sm:px-6 py-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((leave) => (
                <tr
                  key={leave._id}
                  className="border-b border-border last:border-0 hover:bg-page-bg/50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(leave)}
                >
                  <td className="px-4 sm:px-6 py-4 text-sm font-medium">
                    {leave.employee?.firstName} {leave.employee?.lastName}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <Badge text={leave.type} />
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-text-secondary">
                    {new Date(leave.startDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(leave.endDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td
                    className="px-4 sm:px-6 py-4 text-sm text-text-secondary max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis"
                    title={leave.reason}
                  >
                    {leave.reason}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <Badge text={leave.status} />
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    {leave.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatus(leave._id, "APPROVED")}
                          className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-full hover:bg-green-100"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatus(leave._id, "REJECTED")}
                          className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full hover:bg-red-100"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-text-secondary"
                  >
                    No leave requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LeaveDetailModal
        isOpen={showDetail}
        onClose={() => {
          setShowDetail(false);
          setSelectedLeave(null);
        }}
        leave={selectedLeave}
        onSuccess={fetchLeaves}
      />
    </div>
  );
}
