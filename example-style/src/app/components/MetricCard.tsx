import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface MetricCardProps {
  title: string;
  value: string;
  change?: {
    value: string;
    type: 'increase' | 'decrease';
  };
  sparklineData?: Array<{ value: number }>;
  trend?: 'up' | 'down';
  subtitle?: string;
  updatedAgo: string;
}

export function MetricCard({
  title,
  value,
  change,
  sparklineData,
  trend,
  subtitle,
  updatedAgo,
}: MetricCardProps) {
  return (
    <div className="bg-[#1E293B] rounded-lg p-6 border border-[#334155]">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <h3 className="text-3xl font-semibold text-white">{value}</h3>
        </div>
        {trend && (
          <div className={`p-2 rounded-lg ${trend === 'up' ? 'bg-[#22C55E]/10' : 'bg-[#EF4444]/10'}`}>
            {trend === 'up' ? (
              <ArrowUp className="w-5 h-5 text-[#22C55E]" />
            ) : (
              <ArrowDown className="w-5 h-5 text-[#EF4444]" />
            )}
          </div>
        )}
      </div>

      {change && (
        <div className="flex items-center gap-2 mb-3">
          {change.type === 'increase' ? (
            <TrendingUp className="w-4 h-4 text-[#22C55E]" />
          ) : (
            <TrendingDown className="w-4 h-4 text-[#EF4444]" />
          )}
          <span className={`text-sm font-medium ${change.type === 'increase' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
            {change.value}
          </span>
          <span className="text-sm text-gray-400">from yesterday</span>
        </div>
      )}

      {sparklineData && (
        <div className="h-12 mb-3 w-full">
          <ResponsiveContainer width="100%" height={48}>
            <LineChart data={sparklineData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#A192F8"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {subtitle && (
        <p className="text-sm text-gray-400 mb-3">{subtitle}</p>
      )}

      <div className="text-xs text-gray-500">Updated {updatedAgo}</div>
    </div>
  );
}