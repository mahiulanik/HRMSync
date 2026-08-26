import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Modal from '../../components/Modal';

export default function EditPayslipModal({ isOpen, onClose, onSuccess, payslip }) {
  const [form, setForm] = useState({
    grossSalary: '',
    allowances: '0',
    deductions: '0',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && payslip) {
      setForm({
        grossSalary: payslip.grossSalary || '',
        allowances: payslip.allowances || '0',
        deductions: payslip.totalDeductions || '0',
      });
      setError('');
    }
  }, [isOpen, payslip]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const gross = Number(form.grossSalary) || 0;
  const allowance = Number(form.allowances) || 0;
  const deduction = Number(form.deductions) || 0;
  const basicSalary = Math.round(gross * 0.5);
  const houseRent = Math.round(gross * 0.25);
  const medical = Math.round(gross * 0.125);
  const conveyance = Math.round(gross * 0.125);
  const netSalary = gross + allowance - deduction;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.put(`/update-payslip/${payslip._id}`, {
        grossSalary: gross,
        allowances: allowance,
        deductions: deduction,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update payslip');
    } finally {
      setLoading(false);
    }
  };

  const emp = payslip?.employee || payslip?.employeeId || {};

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Payslip" subtitle={`${emp.firstName || ''} ${emp.lastName || ''}`}>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      <div className="mb-4 p-3 bg-page-bg rounded-lg text-sm text-text-secondary">
        {payslip?.month && payslip?.year && (
          <span>Period: {['January','February','March','April','May','June','July','August','September','October','November','December'][payslip.month - 1]} {payslip.year}</span>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Gross Salary</label>
          <input name="grossSalary" type="number" value={form.grossSalary} onChange={handleChange} className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary" required />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Basic (50%)</label>
            <input type="number" value={basicSalary} readOnly className="w-full px-3 py-2.5 border border-border rounded-lg bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">House Rent (25%)</label>
            <input type="number" value={houseRent} readOnly className="w-full px-3 py-2.5 border border-border rounded-lg bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Medical (12.5%)</label>
            <input type="number" value={medical} readOnly className="w-full px-3 py-2.5 border border-border rounded-lg bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Conveyance (12.5%)</label>
            <input type="number" value={conveyance} readOnly className="w-full px-3 py-2.5 border border-border rounded-lg bg-gray-50 text-gray-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Allowances</label>
            <input name="allowances" type="number" value={form.allowances} onChange={handleChange} className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Deductions</label>
            <input name="deductions" type="number" value={form.deductions} onChange={handleChange} className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:border-primary" />
          </div>
        </div>

        <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-sm">Net Salary</span>
            <span className="text-xl font-bold text-primary">৳{netSalary.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-page-bg transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}