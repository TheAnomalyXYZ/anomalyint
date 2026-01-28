import { X, Copy, ExternalLink } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { useState } from 'react';

interface NFTMint {
  id: string;
  walletAddress: string;
  txHash: string;
  project: string;
  chain: string;
  qty: number;
  salePhase: string | null;
  amount: number | null;
  mintedAt: string;
  userId?: string;
  tokenId?: string;
  imageUrl?: string;
}

interface NFTMintDetailDrawerProps {
  mint: NFTMint | null;
  onClose: () => void;
}

export function NFTMintDetailDrawer({ mint, onClose }: NFTMintDetailDrawerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!mint) return null;

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

  const getExplorerUrl = (chain: string, txHash: string) => {
    const explorers: Record<string, string> = {
      'Avalanche': `https://snowtrace.io/tx/${txHash}`,
      'Ethereum': `https://etherscan.io/tx/${txHash}`,
    };
    return explorers[chain] || '#';
  };

  const getPhaseColor = (phase: string | null) => {
    if (!phase) return null;
    const colors: Record<string, string> = {
      'Public': 'bg-green-500/10 text-green-400 border border-green-500/20',
      'Allowlist': 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    };
    return colors[phase] || 'bg-gray-500/10 text-gray-300 border border-gray-500/20';
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
            <h2 className="text-xl font-bold text-white">Mint Details</h2>
            <p className="text-sm text-gray-400 mt-1">Transaction #{mint.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#334155] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* NFT Image */}
          {mint.imageUrl && (
            <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
              <ImageWithFallback
                src={mint.imageUrl}
                alt={`${mint.project} NFT`}
                className="w-full rounded-lg"
              />
            </div>
          )}

          {/* Project & Phase */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
              <div className="text-xs text-gray-400 mb-2">Project</div>
              <div className="text-lg font-semibold text-white">{mint.project}</div>
            </div>
            <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
              <div className="text-xs text-gray-400 mb-2">Sale Phase</div>
              {mint.salePhase ? (
                <span className={`text-xs px-2 py-1 rounded ${getPhaseColor(mint.salePhase)}`}>
                  {mint.salePhase}
                </span>
              ) : (
                <span className="text-sm text-gray-500">—</span>
              )}
            </div>
          </div>

          {/* Token ID & Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
              <div className="text-xs text-gray-400 mb-2">Token ID</div>
              <div className="text-lg font-semibold text-white">{mint.tokenId || '—'}</div>
            </div>
            <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
              <div className="text-xs text-gray-400 mb-2">Quantity</div>
              <div className="text-lg font-semibold text-white">{mint.qty}</div>
            </div>
          </div>

          {/* Chain & Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
              <div className="text-xs text-gray-400 mb-2">Chain</div>
              <div className="text-lg font-semibold text-white">{mint.chain}</div>
            </div>
            <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
              <div className="text-xs text-gray-400 mb-2">Amount</div>
              <div className="text-lg font-semibold text-[#22C55E]">
                {mint.amount !== null ? `$${mint.amount.toFixed(2)}` : '—'}
              </div>
            </div>
          </div>

          {/* Wallet Address */}
          <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
            <div className="text-xs text-gray-400 mb-2">Wallet Address</div>
            <div className="flex items-center justify-between gap-2">
              <code className="text-sm text-gray-300 break-all">{mint.walletAddress}</code>
              <button
                onClick={() => copyToClipboard(mint.walletAddress, 'wallet')}
                className="flex-shrink-0 p-2 hover:bg-[#334155] rounded transition-colors"
              >
                {copiedId === 'wallet' ? (
                  <span className="text-xs text-[#22C55E] font-medium">Copied!</span>
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Transaction Hash */}
          <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
            <div className="text-xs text-gray-400 mb-2">Transaction Hash</div>
            <div className="flex items-center justify-between gap-2">
              <code className="text-sm text-[#A192F8] break-all">{mint.txHash}</code>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => copyToClipboard(mint.txHash, 'txhash')}
                  className="p-2 hover:bg-[#334155] rounded transition-colors"
                >
                  {copiedId === 'txhash' ? (
                    <span className="text-xs text-[#22C55E] font-medium">Copied!</span>
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                <a
                  href={getExplorerUrl(mint.chain, mint.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-[#334155] rounded transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-gray-400 hover:text-[#A192F8]" />
                </a>
              </div>
            </div>
          </div>

          {/* User ID */}
          {mint.userId && (
            <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
              <div className="text-xs text-gray-400 mb-2">User ID</div>
              <button
                onClick={() => {/* Navigate to user detail */}}
                className="text-sm text-[#A192F8] hover:underline"
              >
                {mint.userId}
              </button>
            </div>
          )}

          {/* Minted At */}
          <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
            <div className="text-xs text-gray-400 mb-2">Minted At</div>
            <div className="text-lg font-semibold text-white">{mint.mintedAt}</div>
          </div>
        </div>
      </div>
    </>
  );
}