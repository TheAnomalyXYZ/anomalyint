import { useState } from 'react';
import { Copy, ExternalLink, ArrowUpDown } from 'lucide-react';

interface NFTMint {
  id: string;
  walletAddress: string;
  userId: string;
  txHash: string;
  project: string;
  chain: string;
  qty: number;
  salePhase: string | null;
  amount: number | null;
  mintedAt: string;
  tokenId?: string;
  imageUrl?: string;
}

interface NFTMintsTableProps {
  mints: NFTMint[];
  onMintClick: (mint: NFTMint) => void;
}

export function NFTMintsTable({ mints, onMintClick }: NFTMintsTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'qty' | 'amount' | 'mintedAt'>('mintedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...`;
  };

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

  const getProjectColor = (project: string) => {
    const colors: Record<string, string> = {
      'Loot Die': 'bg-red-500/10 text-red-400 border border-red-500/20',
      'Mystery Bowl': 'bg-teal-500/10 text-teal-400 border border-teal-500/20',
    };
    return colors[project] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  };

  const getPhaseColor = (phase: string | null) => {
    if (!phase) return null;
    const colors: Record<string, string> = {
      'Public': 'bg-green-500/10 text-green-400 border border-green-500/20',
      'Allowlist': 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    };
    return colors[phase] || 'bg-gray-500/10 text-gray-300 border border-gray-500/20';
  };

  const getChainIcon = (chain: string) => {
    // Using brand colors for chain dots
    const colors: Record<string, string> = {
      'Avalanche': 'bg-[#E84142]',
      'Ethereum': 'bg-[#627EEA]',
      'Solana': 'bg-[#00FFA3]',
      'Aptos': 'bg-[#2DD8A3]',
    };
    return colors[chain] || 'bg-gray-500';
  };

  const getExplorerUrl = (chain: string, txHash: string) => {
    const explorers: Record<string, string> = {
      'Avalanche': `https://snowtrace.io/tx/${txHash}`,
      'Ethereum': `https://etherscan.io/tx/${txHash}`,
    };
    return explorers[chain] || '#';
  };

  const handleSort = (field: 'qty' | 'amount' | 'mintedAt') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-[#0F172A] border-b border-[#334155] sticky top-0">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Wallet Address
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              User
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Tx Hash
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Project
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Chain
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
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Sale Phase
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
              <button
                onClick={() => handleSort('mintedAt')}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                Minted At
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#334155]">
          {mints.map((mint) => (
            <tr
              key={mint.id}
              onClick={() => onMintClick(mint)}
              className="hover:bg-[#334155]/30 cursor-pointer transition-colors group"
            >
              {/* Wallet Address */}
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <code className="text-sm text-gray-300">{truncateAddress(mint.walletAddress)}</code>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(mint.walletAddress, `wallet-${mint.id}`);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                  >
                    {copiedId === `wallet-${mint.id}` ? (
                      <span className="text-xs text-[#22C55E]">✓</span>
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </td>

              {/* User */}
              <td className="px-4 py-4">
                <code className="text-sm text-gray-300">{truncateAddress(mint.userId)}</code>
              </td>

              {/* Tx Hash */}
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <code className="text-sm text-[#A192F8]">{truncateAddress(mint.txHash)}</code>
                  <a
                    href={getExplorerUrl(mint.chain, mint.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-[#A192F8]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </td>

              {/* Project */}
              <td className="px-4 py-4">
                <span className={`text-xs px-2 py-1 rounded ${getProjectColor(mint.project)}`}>
                  {mint.project}
                </span>
              </td>

              {/* Chain */}
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getChainIcon(mint.chain)}`} />
                  <span className="text-sm text-gray-300">{mint.chain}</span>
                </div>
              </td>

              {/* Qty */}
              <td className="px-4 py-4">
                <span className="text-sm text-white font-medium">{mint.qty}</span>
              </td>

              {/* Sale Phase */}
              <td className="px-4 py-4">
                {mint.salePhase ? (
                  <span className={`text-xs px-2 py-1 rounded ${getPhaseColor(mint.salePhase)}`}>
                    {mint.salePhase}
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">—</span>
                )}
              </td>

              {/* Amount */}
              <td className="px-4 py-4 text-right">
                {mint.amount !== null ? (
                  <span className="text-sm text-white font-medium">
                    ${mint.amount.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">—</span>
                )}
              </td>

              {/* Minted At */}
              <td className="px-4 py-4">
                <span className="text-sm text-gray-300">{mint.mintedAt}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}