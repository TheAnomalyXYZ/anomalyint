import { TrendingUp, TrendingDown } from 'lucide-react';
import { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  sparkline?: ReactNode;
}

export function MetricCard({ title, value, subtitle, icon, trend, sparkline }: MetricCardProps) {
  return (
    <div className="bg-card border border-default rounded-2xl p-6 shadow-card hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm text-secondary mb-2">{title}</div>
          <div className="text-3xl font-bold text-primary">{value}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {icon && <div className="p-2 bg-[#A192F8]/10 rounded-lg text-[#A192F8]">{icon}</div>}
          {trend && (
            <div
              className={`flex items-center gap-1 text-sm ${
                trend.direction === 'up' ? 'text-[#22C55E]' : 'text-[#EF4444]'
              }`}
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {trend.value}
            </div>
          )}
        </div>
      </div>
      {subtitle && <div className="text-sm text-muted mt-2">{subtitle}</div>}
      {sparkline && <div className="mt-4">{sparkline}</div>}
    </div>
  );
}
