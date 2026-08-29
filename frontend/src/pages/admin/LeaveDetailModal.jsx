import { useState } from "react";
import api from "../../api/axios";
import Modal from "../../components/Modal";
import Badge from "../../components/Badge";
import { User, FileText, Calendar, CheckCircle, XCircle } from "lucide-react";

export default function LeaveDetailModal({
  isOpen,
  onClose,
  leave,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);

  if (!leave) return null;

  const handleStatus = async (status) => {
    setLoading(true);
    try {
      await api.patch(`/update-leave/${leave._id}`, { status });
      onSuccess();
      onClose();
    } catch {
      alert("Failed to update leave status");
    } finally {
      setLoading(false);
    }
  };

  const startDate = new Date(leave.startDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const endDate = new Date(leave.endDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Leave Request Details"
      subtitle="Review and take action on this leave request"
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 p-3 bg-page-bg rounded-lg">
          <User size={18} className="text-text-secondary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-text-secondary">Employee</p>
            <p className="text-sm font-semibold">
              {leave.employee?.firstName} {leave.employee?.lastName}
            </p>
            {leave.employee?.email && (
              <p className="text-xs text-text-secondary mt-0.5">
                {leave.employee.email}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-page-bg rounded-lg">
          <FileText size={18} className="text-text-secondary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-text-secondary">Leave Type</p>
            <Badge text={leave.type} />
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-page-bg rounded-lg">
          <Calendar size={18} className="text-text-secondary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-text-secondary">Duration</p>
            <p className="text-sm font-medium">{startDate}</p>
            <p className="text-sm font-medium">to {endDate}</p>
          </div>
        </div>

        <div className="p-3 bg-page-bg rounded-lg">
          <p className="text-xs text-text-secondary mb-1">Reason</p>
          <div className="max-h-[200px] overflow-y-auto overflow-x-hidden">
            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap break-words">
              {leave.reason || "No reason provided"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-page-bg rounded-lg">
          <p className="text-xs text-text-secondary">Status</p>
          <div className="ml-auto">
            <Badge text={leave.status} />
          </div>
        </div>

        {leave.status === "PENDING" && (
          <div className="flex gap-3 pt-2 border-t border-border">
            <button
              onClick={() => handleStatus("APPROVED")}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 text-green-600 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              <CheckCircle size={16} /> Approve
            </button>
            <button
              onClick={() => handleStatus("REJECTED")}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <XCircle size={16} /> Reject
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
