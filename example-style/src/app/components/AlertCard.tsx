import { AlertCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react';

interface AlertCardProps {
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
}

export function AlertCard({ type, title, message, timestamp }: AlertCardProps) {
  const styles = {
    critical: {
      bg: 'bg-[#EF4444]/10 dark:bg-[#EF4444]/5',
      border: 'border-[#EF4444]/30',
      iconBg: 'bg-[#EF4444]/20',
      icon: <AlertCircle className="w-5 h-5 text-[#EF4444]" />,
    },
    warning: {
      bg: 'bg-[#F59E0B]/10 dark:bg-[#F59E0B]/5',
      border: 'border-[#F59E0B]/30',
      iconBg: 'bg-[#F59E0B]/20',
      icon: <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />,
    },
    info: {
      bg: 'bg-[#A192F8]/10 dark:bg-[#A192F8]/5',
      border: 'border-[#A192F8]/30',
      iconBg: 'bg-[#A192F8]/20',
      icon: <Info className="w-5 h-5 text-[#A192F8]" />,
    },
  };

  const style = styles[type];

  return (
    <div className={`rounded-3xl p-4 border ${style.bg} ${style.border}`}>
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded-lg ${style.iconBg}`}>{style.icon}</div>

        <div className="flex-1">
          <h4 className="text-sm font-medium text-primary mb-1">{title}</h4>
          <p className="text-sm text-secondary mb-1">{message}</p>
          <p className="text-xs text-muted">{timestamp}</p>
        </div>

        <button className="text-[#A192F8] hover:text-[#B8ACFC] transition-colors flex items-center gap-1 text-sm cursor-pointer">
          View
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}