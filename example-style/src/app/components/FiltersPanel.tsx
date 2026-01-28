import { X } from 'lucide-react';

interface FiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FiltersPanel({ isOpen, onClose }: FiltersPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-96 bg-card border-l border-default z-50 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-primary">Filters</h2>
            <button
              onClick={onClose}
              className="text-secondary hover:text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Login Method */}
            <div>
              <label className="text-sm font-medium text-primary mb-3 block">Login Method</label>
              <div className="space-y-2">
                {['Gmail', 'Email', 'Metamask', 'Phantom', 'WalletConnect', 'Discord', 'Telegram'].map((method) => (
                  <label key={method} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-default bg-card text-[#A192F8] accent-[#A192F8]" />
                    <span className="text-sm text-primary">{method}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Games */}
            <div>
              <label className="text-sm font-medium text-primary mb-3 block">Games</label>
              <select className="w-full bg-hover border border-default rounded-lg px-3 py-2 text-sm text-primary">
                <option>All Games</option>
                <option>Neura Knights</option>
                <option>Goonville</option>
                <option>GMeow</option>
                <option>Vectra</option>
              </select>
            </div>

            {/* KYC Level */}
            <div>
              <label className="text-sm font-medium text-primary mb-3 block">KYC Level</label>
              <select className="w-full bg-hover border border-default rounded-lg px-3 py-2 text-sm text-primary">
                <option>All Levels</option>
                <option>None</option>
                <option>L1</option>
                <option>L2</option>
              </select>
            </div>

            {/* Has Privy Wallet */}
            <div>
              <label className="text-sm font-medium text-primary mb-3 block">Has Privy Wallet</label>
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 bg-hover border border-default rounded-lg text-sm text-primary hover:border-[#A192F8] transition-colors">
                  All
                </button>
                <button className="flex-1 px-3 py-2 bg-hover border border-default rounded-lg text-sm text-primary hover:border-[#A192F8] transition-colors">
                  Yes
                </button>
                <button className="flex-1 px-3 py-2 bg-hover border border-default rounded-lg text-sm text-primary hover:border-[#A192F8] transition-colors">
                  No
                </button>
              </div>
            </div>

            {/* IP Address */}
            <div>
              <label className="text-sm font-medium text-primary mb-3 block">IP Address Contains</label>
              <input
                type="text"
                placeholder="e.g., 192.168"
                className="w-full bg-hover border border-default rounded-lg px-3 py-2 text-sm text-primary placeholder-secondary"
              />
            </div>

            {/* ASN */}
            <div>
              <label className="text-sm font-medium text-primary mb-3 block">ASN Contains</label>
              <input
                type="text"
                placeholder="e.g., SingTel, AWS"
                className="w-full bg-hover border border-default rounded-lg px-3 py-2 text-sm text-primary placeholder-secondary"
              />
            </div>

            {/* Email Domain */}
            <div>
              <label className="text-sm font-medium text-primary mb-3 block">Email Domain</label>
              <input
                type="text"
                placeholder="e.g., icloud.com"
                className="w-full bg-hover border border-default rounded-lg px-3 py-2 text-sm text-primary placeholder-secondary"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="text-sm font-medium text-primary mb-3 block">Created Date</label>
              <div className="space-y-2">
                <input
                  type="date"
                  className="w-full bg-hover border border-default rounded-lg px-3 py-2 text-sm text-primary"
                />
                <input
                  type="date"
                  className="w-full bg-hover border border-default rounded-lg px-3 py-2 text-sm text-primary"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button className="flex-1 px-4 py-2 bg-[#A192F8] text-white rounded-lg text-sm font-medium hover:bg-[#9178E8] transition-colors">
              Apply Filters
            </button>
            <button className="px-4 py-2 bg-hover border border-default text-primary rounded-lg text-sm font-medium hover:border-[#A192F8] transition-colors">
              Reset
            </button>
          </div>
        </div>
      </div>
    </>
  );
}