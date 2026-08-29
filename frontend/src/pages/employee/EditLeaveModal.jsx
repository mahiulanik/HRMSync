import { useState, useEffect } from "react";
import api from "../../api/axios";
import { getApiError } from "../../utils/apiError";
import Modal from "../../components/Modal";
import { FileText, Calendar } from "lucide-react";

export default function EditLeaveModal({ isOpen, onClose, leave, onSuccess }) {
  const [form, setForm] = useState({
    type: "SICK",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (leave) {
      setForm({
        type: leave.type || "SICK",
        startDate: leave.startDate
          ? new Date(leave.startDate).toISOString().split("T")[0]
          : "",
        endDate: leave.endDate
          ? new Date(leave.endDate).toISOString().split("T")[0]
          : "",
        reason: leave.reason || "",
      });
    }
  }, [leave]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.put(`/edit-leave/${leave._id}`, form);
      onSuccess();
      onClose();
    } catch (err) {
      setError(getApiError(err, "Failed to update leave"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Leave"
      subtitle="Update your leave request"
    >
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
            <FileText size={16} className="text-text-secondary" /> Leave Type
          </label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary bg-white"
          >
            <option value="SICK">Sick Leave</option>
            <option value="CASUAL">Casual Leave</option>
            <option value="EARNED">Annual Leave</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
            <Calendar size={16} className="text-text-secondary" /> Duration
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                From
              </label>
              <input
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                To
              </label>
              <input
                name="endDate"
                type="date"
                value={form.endDate}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary"
                required
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1.5">Reason</label>
          <textarea
            name="reason"
            value={form.reason}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary resize-none"
            placeholder="Briefly describe why you need this leave..."
            required
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer active:scale-95 px-5 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-page-bg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer active:scale-95 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <FileText size={16} /> {loading ? "Updating..." : "Update"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
