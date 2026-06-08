import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  badge?: {
    text: string;
    variant: 'success' | 'danger' | 'warning' | 'info';
  };
}

export default function StatCard({ icon, title, value, badge }: StatCardProps) {
  const badgeColors = {
    success: 'bg-emerald-100 text-emerald-700',
    danger: 'bg-red-100 text-red-700',
    warning: 'bg-orange-100 text-orange-700',
    info: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="backdrop-blur-md bg-white/70 border border-white/30 rounded-3xl shadow-lg p-8 hover:shadow-xl transition-all">
      <div className="flex items-start justify-between mb-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
          {icon}
        </div>
        {badge && (
          <span className={`px-3 py-1 rounded-full text-xs ${badgeColors[badge.variant]}`}>
            {badge.text}
          </span>
        )}
      </div>
      <div className="text-4xl mb-2">{value}</div>
      <div className="text-gray-600 text-sm uppercase tracking-wide">{title}</div>
    </div>
  );
}
