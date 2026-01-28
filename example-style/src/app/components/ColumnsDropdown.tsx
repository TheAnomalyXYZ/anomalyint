import { useEffect, useRef, useState } from 'react';

interface ColumnsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  visibleColumns: Record<string, boolean>;
  onToggleColumn: (columnId: string) => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

const COLUMN_OPTIONS = [
  { id: 'userId', label: 'User ID' },
  { id: 'email', label: 'Email' },
  { id: 'loginMethods', label: 'Login Methods' },
  { id: 'kyc', label: 'KYC' },
  { id: 'privyWallet', label: 'Privy Wallet' },
  { id: 'connectedWallets', label: 'Connected Wallets' },
  { id: 'fordefiWallet', label: 'Fordefi Wallet' },
  { id: 'games', label: 'Games' },
  { id: 'ipAddress', label: 'IP Address' },
  { id: 'asn', label: 'ASN' },
  { id: 'created', label: 'Created' },
  { id: 'lastActive', label: 'Last Active' },
];

export function ColumnsDropdown({ 
  isOpen, 
  onClose, 
  visibleColumns, 
  onToggleColumn,
  buttonRef 
}: ColumnsDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number>(400);

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    // Calculate available space below the button
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - buttonRect.bottom - 16; // 16px margin
    
    // Set max height to available space, with a minimum of 200px
    setMaxHeight(Math.max(200, Math.min(500, spaceBelow)));
  }, [isOpen, buttonRef]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, buttonRef]);

  if (!isOpen) return null;

  const handleShowAll = () => {
    COLUMN_OPTIONS.forEach((col) => {
      if (!visibleColumns[col.id]) {
        onToggleColumn(col.id);
      }
    });
  };

  const handleHideAll = () => {
    COLUMN_OPTIONS.forEach((col) => {
      if (visibleColumns[col.id]) {
        onToggleColumn(col.id);
      }
    });
  };

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full left-0 mt-2 w-64 bg-card border border-default rounded-xl shadow-xl z-50 overflow-hidden max-h-[calc(100vh-200px)]"
    >
      <div className="p-3 border-b border-default">
        <div className="flex gap-2">
          <button
            onClick={handleShowAll}
            className="flex-1 px-2 py-1.5 bg-hover border border-default rounded text-xs text-primary hover:border-[#A192F8] transition-colors"
          >
            Show All
          </button>
          <button
            onClick={handleHideAll}
            className="flex-1 px-2 py-1.5 bg-hover border border-default rounded text-xs text-primary hover:border-[#A192F8] transition-colors"
          >
            Hide All
          </button>
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: `${maxHeight}px` }}>
        {COLUMN_OPTIONS.map((column) => (
          <label
            key={column.id}
            className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-hover cursor-pointer transition-colors"
          >
            <span className="text-sm text-primary">{column.label}</span>
            <input
              type="checkbox"
              checked={visibleColumns[column.id]}
              onChange={() => onToggleColumn(column.id)}
              className="w-4 h-4 rounded border-default bg-card text-[#A192F8] accent-[#A192F8]"
            />
          </label>
        ))}
      </div>

      <div className="p-2 border-t border-default bg-hover/50">
        <div className="text-xs text-secondary text-center">
          {Object.values(visibleColumns).filter(Boolean).length} of {COLUMN_OPTIONS.length} visible
        </div>
      </div>
    </div>
  );
}