import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  sparkline?: ReactNode;
  icon?: ReactNode;
}

export function StatCard({ label, value, trend, sparkline, icon }: StatCardProps) {
  return (
    <div className="bg-card border border-default rounded-2xl p-6 shadow-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm text-secondary mb-2">{label}</div>
          <div className="text-3xl font-bold text-primary">{value}</div>
        </div>
        {(trend || icon) && (
          <div className="flex flex-col items-end gap-2">
            {icon}
            {trend && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  trend.isPositive ? 'text-[#22C55E]' : 'text-[#EF4444]'
                }`}
              >
                {trend.isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {trend.value}
              </div>
            )}
          </div>
        )}
      </div>
      {sparkline && <div className="mt-4">{sparkline}</div>}
    </div>
  );
}
