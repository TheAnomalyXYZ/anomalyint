import { ReactNode } from 'react';

interface FilterButtonProps {
  icon?: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  variant?: 'default' | 'primary';
}

export function FilterButton({
  icon,
  label,
  onClick,
  active = false,
  variant = 'default',
}: FilterButtonProps) {
  const baseClasses =
    'px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer';

  const variantClasses = {
    default: active
      ? 'bg-[#A192F8] text-white'
      : 'bg-card border border-default text-primary hover:bg-hover',
    primary: 'bg-[#A192F8] text-white hover:bg-[#9178E8]',
  };

  return (
    <button onClick={onClick} className={`${baseClasses} ${variantClasses[variant]}`}>
      {icon}
      {label}
    </button>
  );
}
