import { ReactNode } from 'react';

interface DataCardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function DataCard({ children, className = '', padding = 'md', hover = false }: DataCardProps) {
  return (
    <div
      className={`bg-card border border-default rounded-2xl shadow-card transition-all overflow-hidden ${
        paddingMap[padding]
      } ${hover ? 'hover:scale-[1.01] hover:shadow-lg cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}