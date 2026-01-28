import { Search } from 'lucide-react';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SearchInput({
  placeholder = 'Search...',
  value,
  onChange,
  className = '',
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-card border border-default rounded-lg pl-10 pr-4 py-2.5 text-sm text-primary placeholder-muted focus:outline-none focus:border-[#A192F8] transition-colors"
      />
    </div>
  );
}
