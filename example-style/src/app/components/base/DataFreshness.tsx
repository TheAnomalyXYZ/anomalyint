import { RefreshCw } from 'lucide-react';

interface DataFreshnessProps {
  timestamp: string;
  onRefresh?: () => void;
  showCount?: boolean;
  count?: number;
}

export function DataFreshness({ timestamp, onRefresh, showCount, count }: DataFreshnessProps) {
  return (
    <div className="flex items-center justify-between text-sm text-secondary">
      {showCount && count !== undefined && <div>Showing {count} items</div>}
      <div className="flex items-center gap-2 ml-auto">
        <RefreshCw className="w-4 h-4" />
        <span>Data as of {timestamp}</span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="ml-2 p-1.5 hover:bg-hover rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-[#A192F8]" />
          </button>
        )}
      </div>
    </div>
  );
}
