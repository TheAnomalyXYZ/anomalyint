import { useState } from 'react';
import { ExternalLink, ArrowUpDown, Star } from 'lucide-react';

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

interface PurchasesTableProps {
  purchases: Purchase[];
  onPurchaseClick: (purchase: Purchase) => void;
}

export function PurchasesTable({ purchases, onPurchaseClick }: PurchasesTableProps) {
  const [sortField, setSortField] = useState<'qty' | 'amount' | 'createdAt'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const truncateId = (id: string) => {
    return `${id.slice(0, 8)}...`;
  };

  const getTypeColor = (type: 'Stars' | 'Crypto') => {
    return type === 'Stars' 
      ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20'
      : 'bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20';
  };

  const getGameColor = (game: string) => {
    const colors: Record<string, string> = {
      'GMeow': 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
      'Goonville': 'bg-green-500/10 text-green-400 border border-green-500/20',
      'MooFO': 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
    };
    return colors[game] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
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

  const getExplorerUrl = (chain: string | undefined, txId: string) => {
    if (!chain) return '#';
    const explorers: Record<string, string> = {
      'Sophon': `https://explorer.sophon.xyz/tx/${txId}`,
      'Base': `https://basescan.org/tx/${txId}`,
    };
    return explorers[chain] || '#';
  };

  const handleSort = (field: 'qty' | 'amount' | 'createdAt') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatAmount = (purchase: Purchase) => {
    if (purchase.type === 'Stars') {
      return purchase.amount.toLocaleString();
    } else {
      return `$${purchase.amount.toFixed(2)}`;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-[#0F172A] border-b border-[#334155] sticky top-0">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              User
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Game
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Item
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              <button
                onClick={() => handleSort('qty')}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                Qty
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              <button
                onClick={() => handleSort('amount')}
                className="flex items-center gap-1 ml-auto hover:text-white transition-colors"
              >
                Amount
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Currency
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Platform
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Tx ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              <button
                onClick={() => handleSort('createdAt')}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                Created At
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#334155]">
          {purchases.map((purchase) => (
            <tr
              key={purchase.id}
              onClick={() => onPurchaseClick(purchase)}
              className="hover:bg-[#334155]/30 cursor-pointer transition-colors group"
            >
              {/* Type */}
              <td className="px-4 py-4">
                <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 w-fit ${getTypeColor(purchase.type)}`}>
                  {purchase.type === 'Stars' && <Star className="w-3 h-3 fill-current" />}
                  {purchase.type}
                </span>
              </td>

              {/* User */}
              <td className="px-4 py-4">
                <button
                  onClick={() => {
                    // Navigate to user detail
                  }}
                  className="text-sm text-[#A192F8] hover:underline"
                >
                  {truncateId(purchase.userId)}
                </button>
              </td>

              {/* Game */}
              <td className="px-4 py-4">
                <span className={`text-xs px-2 py-1 rounded ${getGameColor(purchase.game)}`}>
                  {purchase.game}
                </span>
              </td>

              {/* Item */}
              <td className="px-4 py-4">
                <div className="text-sm text-gray-300">
                  {purchase.itemEmoji && <span className="mr-1">{purchase.itemEmoji}</span>}
                  {purchase.item}
                  {purchase.itemPrice && <span className="text-gray-500 ml-1">@ {purchase.itemPrice}</span>}
                </div>
              </td>

              {/* Qty */}
              <td className="px-4 py-4">
                <span className="text-sm text-white font-medium">{purchase.qty}</span>
              </td>

              {/* Amount */}
              <td className="px-4 py-4 text-right">
                <span className="text-sm text-white font-medium">
                  {formatAmount(purchase)}
                </span>
              </td>

              {/* Currency */}
              <td className="px-4 py-4">
                <span className="text-sm text-gray-300">{purchase.currency}</span>
              </td>

              {/* Platform */}
              <td className="px-4 py-4">
                <span className="text-sm text-gray-300">{purchase.platform}</span>
              </td>

              {/* Status */}
              <td className="px-4 py-4">
                <span className={`text-xs px-2 py-1 rounded capitalize ${getStatusColor(purchase.status)}`}>
                  {purchase.status}
                </span>
              </td>

              {/* Tx ID */}
              <td className="px-4 py-4">
                {purchase.type === 'Crypto' ? (
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-[#A192F8]">{truncateId(purchase.txId)}</code>
                    <a
                      href={getExplorerUrl(purchase.chain, purchase.txId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-[#A192F8]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <code className="text-sm text-gray-300">{truncateId(purchase.txId)}</code>
                )}
              </td>

              {/* Created At */}
              <td className="px-4 py-4">
                <span className="text-sm text-gray-300">{purchase.createdAt}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}