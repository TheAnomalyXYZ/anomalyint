import { ArrowUpRight } from 'lucide-react';

interface ColorfulMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color: 'lime' | 'peach' | 'pink' | 'blue' | 'mint' | 'purple';
  icon?: React.ReactNode;
}

const colorMap = {
  lime: 'bg-[var(--metric-lime)]',
  peach: 'bg-[var(--metric-peach)]',
  pink: 'bg-[var(--metric-pink)]',
  blue: 'bg-[var(--metric-blue)]',
  mint: 'bg-[var(--metric-mint)]',
  purple: 'bg-[var(--metric-purple)]',
};

export function ColorfulMetricCard({ title, value, subtitle, color, icon }: ColorfulMetricCardProps) {
  return (
    <div className={`${colorMap[color]} rounded-3xl p-5 transition-transform hover:scale-[1.02] cursor-pointer`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-primary/80">{title}</h3>
        {icon ? (
          <div className="text-primary/60">{icon}</div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4 text-primary/60" />
          </div>
        )}
      </div>
      <div className="text-[32px] font-bold text-primary leading-none mb-2">{value}</div>
      {subtitle && <div className="text-sm text-primary/70">{subtitle}</div>}
    </div>
  );
}