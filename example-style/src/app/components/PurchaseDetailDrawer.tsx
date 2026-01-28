import { X, Copy, ExternalLink, Star } from 'lucide-react';
import { useState } from 'react';

interface Purchase {
  id: string;
  type: 'Stars' | 'Crypto';
  userId: string;
  game: string;
  item: string;
  qty: number;
  amount: number;
  currency: string;
  platform: string;
  status: string;
  txId: string;
  createdAt: string;
  chain?: string;
  itemEmoji?: string;
  itemPrice?: string;
}

interface PurchaseDetailDrawerProps {
  purchase: Purchase | null;
  onClose: () => void;
}

export function PurchaseDetailDrawer({ purchase, onClose }: PurchaseDetailDrawerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!purchase) return null;

  const copyToClipboard = async (text: string, id: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch (fallbackError) {
        console.warn('All copy methods failed:', fallbackError);
      }
    }
  };

  const getExplorerUrl = (chain: string | undefined, txId: string) => {
    if (!chain) return '#';
    const explorers: Record<string, string> = {
      'Sophon': `https://explorer.sophon.xyz/tx/${txId}`,
      'Base': `https://basescan.org/tx/${txId}`,
    };
    return explorers[chain] || '#';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'completed': 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20',
      'succeeded': 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20',
      'pending': 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20',
      'failed': 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  };

  const formatAmount = () => {
    if (purchase.type === 'Stars') {
      return purchase.amount.toLocaleString();
    } else {
      return `$${purchase.amount.toFixed(2)}`;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-[#1E293B] border-l border-[#334155] z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1E293B] border-b border-[#334155] p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Purchase Details</h2>
            <p className="text-sm text-gray-400 mt-1">Transaction #{purchase.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#334155] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
              <div className="text-xs text-gray-400 mb-2">Payment Type</div>
              <div className="flex items-center gap-2">
                {purchase.type === 'Stars' && <Star className="w-5 h-5 text-[#F59E0B] fill-current" />}
                <span className="text-lg font-semibold text-white">{purchase.type}</span>
              </div>
            </div>
            <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
              <div className="text-xs text-gray-400 mb-2">Status</div>
              <span className={`text-xs px-2 py-1 rounded capitalize ${getStatusColor(purchase.status)}`}>
                {purchase.status}
              </span>
            </div>
          </div>

          {/* Game & Item */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
              <div className="text-xs text-gray-400 mb-2">Game</div>
              <div className="text-lg font-semibold text-white">{purchase.game}</div>
            </div>
            <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
              <div className="text-xs text-gray-400 mb-2">Item</div>
              <div className="text-lg font-semibold text-white">
                {purchase.itemEmoji && <span className="mr-1">{purchase.itemEmoji}</span>}
                {purchase.item}
              </div>
            </div>
          </div>

          {/* Quantity & Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
              <div className="text-xs text-gray-400 mb-2">Quantity</div>
              <div className="text-lg font-semibold text-white">{purchase.qty}</div>
            </div>
            <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
              <div className="text-xs text-gray-400 mb-2">Amount</div>
              <div className="text-lg font-semibold text-[#22C55E]">
                {formatAmount()}
              </div>
            </div>
          </div>

          {/* Currency & Platform */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
              <div className="text-xs text-gray-400 mb-2">Currency</div>
              <div className="text-lg font-semibold text-white">{purchase.currency}</div>
            </div>
            <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
              <div className="text-xs text-gray-400 mb-2">Platform</div>
              <div className="text-lg font-semibold text-white">{purchase.platform}</div>
            </div>
          </div>

          {/* User ID */}
          <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
            <div className="text-xs text-gray-400 mb-2">User ID</div>
            <div className="flex items-center justify-between gap-2">
              <code className="text-sm text-gray-300 break-all">{purchase.userId}</code>
              <button
                onClick={() => copyToClipboard(purchase.userId, 'userId')}
                className="flex-shrink-0 p-2 hover:bg-[#334155] rounded transition-colors cursor-pointer"
              >
                {copiedId === 'userId' ? (
                  <span className="text-xs text-[#22C55E] font-medium">Copied!</span>
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Transaction ID */}
          <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
            <div className="text-xs text-gray-400 mb-2">Transaction ID</div>
            <div className="flex items-center justify-between gap-2">
              <code className={`text-sm break-all ${purchase.type === 'Crypto' ? 'text-[#A192F8]' : 'text-gray-300'}`}>
                {purchase.txId}
              </code>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => copyToClipboard(purchase.txId, 'txId')}
                  className="p-2 hover:bg-[#334155] rounded transition-colors cursor-pointer"
                >
                  {copiedId === 'txId' ? (
                    <span className="text-xs text-[#22C55E] font-medium">Copied!</span>
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {purchase.type === 'Crypto' && purchase.chain && (
                  <a
                    href={getExplorerUrl(purchase.chain, purchase.txId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-[#334155] rounded transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-400 hover:text-[#A192F8]" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Item Price (if available) */}
          {purchase.itemPrice && (
            <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
              <div className="text-xs text-gray-400 mb-2">Item Price</div>
              <div className="text-lg font-semibold text-white">{purchase.itemPrice}</div>
            </div>
          )}

          {/* Created At */}
          <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
            <div className="text-xs text-gray-400 mb-2">Created At</div>
            <div className="text-lg font-semibold text-white">{purchase.createdAt}</div>
          </div>
        </div>
      </div>
    </>
  );
}