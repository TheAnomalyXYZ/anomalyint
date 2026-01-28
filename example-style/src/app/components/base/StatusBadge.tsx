interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'success' | 'error' | 'warning' | 'info';
  label: string;
  size?: 'sm' | 'md';
}

const statusColors = {
  active: 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30',
  success: 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30',
  inactive: 'bg-muted/10 text-muted border-muted/30',
  pending: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30',
  warning: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30',
  error: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30',
  info: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export function StatusBadge({ status, label, size = 'sm' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${statusColors[status]} ${sizeClasses[size]}`}
    >
      {label}
    </span>
  );
}
