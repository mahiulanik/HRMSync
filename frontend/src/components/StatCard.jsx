import { Loader2 } from 'lucide-react';

export default function StatCard({ title, value, icon: Icon, className = '', loading = false }) {
  return (
    <div className={`bg-card border border-border rounded-xl p-5 flex items-center justify-between ${className}`}>
      <div>
        <div className="text-sm text-text-secondary mb-1">{title}</div>
        <div className="text-2xl font-bold">
          {loading ? <Loader2 size={20} className="animate-spin text-primary" /> : value}
        </div>
      </div>
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-page-bg flex items-center justify-center text-text-secondary">
          <Icon size={20} />
        </div>
      )}
    </div>
  );
}