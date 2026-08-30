import { useState, useEffect } from "react";
import api from "../../api/axios";
import Badge from "../../components/Badge";
import StatCard from "../../components/StatCard";
import ApplyLeaveModal from "./ApplyLeaveModal";
import EditLeaveModal from "./EditLeaveModal";
import { Plus, Thermometer, Cloud, Award, Pencil, Trash2 } from "lucide-react";

export default function EmployeeLeave() {
  const [leaves, setLeaves] = useState([]);
  const [showApply, setShowApply] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  const fetchLeaves = () => {
    api
      .get("/get-leaves")
      .then((res) => setLeaves(res.data.data || []))
      .catch(() => {});
  };
  useEffect(() => {
    fetchLeaves();
  }, []);

  const sickCount = leaves.filter(
    (l) => l.type === "SICK" && l.status === "APPROVED",
  ).length;
  const casualCount = leaves.filter(
    (l) => l.type === "CASUAL" && l.status === "APPROVED",
  ).length;
  const earnedCount = leaves.filter(
    (l) => l.type === "EARNED" && l.status === "APPROVED",
  ).length;

  const handleEdit = (leave) => {
    setEditingLeave(leave);
    setShowEdit(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this leave request?")) return;
    try {
      await api.delete(`/delete-leave/${id}`);
      fetchLeaves();
    } catch {
      alert("Failed to delete leave");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-text-secondary text-sm">
            Your leave history and requests
          </p>
        </div>
        <button
          onClick={() => setShowApply(true)}
          className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer active:scale-95"
        >
          <Plus size={18} /> Apply for Leave
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <StatCard
          title="Sick Leave"
          value={`${sickCount} taken`}
          icon={Thermometer}
          className="border-l-4 border-l-primary"
        />
        <StatCard
          title="Casual Leave"
          value={`${casualCount} taken`}
          icon={Cloud}
          className="border-l-4 border-l-primary"
        />
        <StatCard
          title="Earned Leave"
          value={`${earnedCount} taken`}
          icon={Award}
          className="border-l-4 border-l-primary"
        />
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-border bg-page-bg/50">
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
              {leaves.map((leave) => (
                <tr
                  key={leave._id}
                  className="border-b border-border last:border-0"
                >
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
                          onClick={() => handleEdit(leave)}
                          className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full hover:bg-primary/20 flex items-center gap-1"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(leave._id)}
                          className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full hover:bg-red-100 flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-text-secondary"
                  >
                    No leave records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ApplyLeaveModal
        isOpen={showApply}
        onClose={() => setShowApply(false)}
        onSuccess={fetchLeaves}
      />
      <EditLeaveModal
        isOpen={showEdit}
        onClose={() => {
          setShowEdit(false);
          setEditingLeave(null);
        }}
        leave={editingLeave}
        onSuccess={fetchLeaves}
      />
    </div>
  );
}
