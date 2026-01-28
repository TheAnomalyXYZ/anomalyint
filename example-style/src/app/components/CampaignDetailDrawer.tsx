import { X, Copy, ExternalLink, Check, TrendingUp, Users, Calendar } from 'lucide-react';
import { useState } from 'react';

type Campaign = {
  id: string;
  name: string;
  status: 'active' | 'ended' | 'scheduled' | 'draft';
  game: string;
  chain: string;
  image: string;
  revenue: string | null;
  mints: number | null;
  participants: number | null;
  dateRange: string;
  progress?: {
    current: number;
    total: number;
  };
  phases?: string;
  contractAddress?: string;
  description?: string;
};

type CampaignDetailDrawerProps = {
  campaign: Campaign | null;
  onClose: () => void;
};

type Phase = {
  id: number;
  name: string;
  price: string;
  supply: number;
  minted: number;
  revenue: string;
  dates: string;
};

const statusConfig = {
  active: { label: 'Active', color: 'bg-[#22C55E] text-white' },
  ended: { label: 'Ended', color: 'bg-gray-600 text-gray-200' },
  scheduled: { label: 'Scheduled', color: 'bg-[#3B82F6] text-white' },
  draft: { label: 'Draft', color: 'bg-[#F59E0B] text-white' },
};

const chainExplorers: Record<string, string> = {
  'Avalanche': 'snowtrace.io',
  'Ethereum': 'etherscan.io',
  'Solana': 'solscan.io',
  'Aptos': 'explorer.aptoslabs.com',
  'Somnia': 'somnium.space',
};

export function CampaignDetailDrawer({ campaign, onClose }: CampaignDetailDrawerProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!campaign) return null;

  const statusStyle = statusConfig[campaign.status];

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Mock data for phases
  const phases: Phase[] = [
    {
      id: 1,
      name: 'Allowlist',
      price: '$70',
      supply: 50,
      minted: 23,
      revenue: '$1,610',
      dates: 'Dec 21, 10am - Dec 21, 6pm',
    },
    {
      id: 2,
      name: 'Public',
      price: '$70',
      supply: 100,
      minted: 8,
      revenue: '$560',
      dates: 'Dec 21, 6pm - Dec 22, 11pm',
    },
  ];

  const mockContractAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const explorerUrl = chainExplorers[campaign.chain] || 'explorer.com';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-3xl bg-[#1E293B] z-50 overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#1E293B] border-b border-[#334155] px-8 py-6 flex items-start justify-between z-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white">{campaign.name}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle.color}`}>
                {statusStyle.label}
              </span>
            </div>
            <div className="flex gap-3 mt-4">
              <button className="px-4 py-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
                Edit
              </button>
              <button className="px-4 py-2 bg-[#0F172A] border border-[#334155] hover:bg-[#334155] text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
                Duplicate
              </button>
              {campaign.status === 'active' && (
                <button className="px-4 py-2 bg-red-600/20 border border-red-600/30 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                  End Campaign
                </button>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#334155] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-8">
          {/* Section 1: Overview */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Overview</h3>
            <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Game</div>
                  <div className="text-white font-medium">{campaign.game}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Chain</div>
                  <div className="text-white font-medium">{campaign.chain}</div>
                </div>
              </div>

              {/* Contract Address */}
              <div>
                <div className="text-sm text-gray-400 mb-2">Contract Address</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-[#1E293B] border border-[#334155] rounded px-3 py-2 text-sm text-gray-300 font-mono">
                    {mockContractAddress}
                  </code>
                  <button
                    onClick={() => copyToClipboard(mockContractAddress, 'contract')}
                    className="p-2 hover:bg-[#334155] rounded transition-colors cursor-pointer"
                  >
                    {copiedField === 'contract' ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <a
                    href={`https://${explorerUrl}/address/${mockContractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-[#334155] rounded transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </a>
                </div>
              </div>

              {/* Date Range */}
              <div>
                <div className="text-sm text-gray-400 mb-1">Date Range</div>
                <div className="text-white">{campaign.dateRange}</div>
              </div>

              {/* Description */}
              <div>
                <div className="text-sm text-gray-400 mb-1">Description</div>
                <div className="text-gray-300">
                  {campaign.description ||
                    'Limited edition NFT drop featuring exclusive in-game items and collectibles.'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Phases */}
          {campaign.status !== 'draft' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Phases</h3>
              <div className="bg-[#0F172A] border border-[#334155] rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#1E293B]">
                      <tr>
                        <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Phase</th>
                        <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Name</th>
                        <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Price</th>
                        <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Supply</th>
                        <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Minted</th>
                        <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Revenue</th>
                        <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Dates</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#334155]">
                      {phases.map((phase) => (
                        <tr key={phase.id} className="hover:bg-[#1E293B]/50">
                          <td className="px-4 py-3 text-sm text-white">{phase.id}</td>
                          <td className="px-4 py-3 text-sm text-white">{phase.name}</td>
                          <td className="px-4 py-3 text-sm text-white">{phase.price}</td>
                          <td className="px-4 py-3 text-sm text-white">{phase.supply}</td>
                          <td className="px-4 py-3 text-sm text-white">{phase.minted}</td>
                          <td className="px-4 py-3 text-sm text-green-400">{phase.revenue}</td>
                          <td className="px-4 py-3 text-sm text-gray-400">{phase.dates}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Allowlist */}
          {campaign.status !== 'draft' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Allowlist</h3>
              <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">247 addresses</div>
                    <div className="text-sm text-gray-400 mt-1">
                      Imported from: rpx.csv, Inferno Labs, APH Web3
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button className="px-4 py-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
                    View Addresses
                  </button>
                  <button className="px-4 py-2 bg-[#0F172A] border border-[#334155] hover:bg-[#334155] text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
                    Import More
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Payment Configuration */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Payment Configuration</h3>
            <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-5 space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-400 mb-2">Accepted Currencies</div>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-[#1E293B] border border-[#334155] rounded text-xs text-gray-300">
                      USDC
                    </span>
                    <span className="px-2 py-1 bg-[#1E293B] border border-[#334155] rounded text-xs text-gray-300">
                      AVAX
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-2">Payment Wallet</div>
                  <div className="text-white">Privy Wallet Required</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-2">Destination Wallet</div>
                  <div className="text-white">User's Choice</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-2">Fee Handling</div>
                  <div className="text-white">Gas Baked Into Price</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Performance */}
          {campaign.status !== 'draft' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">Revenue</span>
                  </div>
                  <div className="text-2xl font-bold text-green-400">{campaign.revenue || '$0'}</div>
                </div>
                <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Participants</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{campaign.participants || 0}</div>
                </div>
                <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Mints</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{campaign.mints || 0}</div>
                </div>
              </div>

              {/* Top Buyers */}
              <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-5 mt-4">
                <h4 className="font-semibold text-white mb-4">Top 5 Buyers</h4>
                <div className="space-y-3">
                  {[
                    { wallet: '0x742d...0bEb', qty: 5, spent: '$350' },
                    { wallet: '0x8a3f...2c4d', qty: 3, spent: '$210' },
                    { wallet: '0x1bc9...7e8f', qty: 2, spent: '$140' },
                  ].map((buyer, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1E293B] border border-[#334155] flex items-center justify-center text-xs text-gray-400">
                          #{i + 1}
                        </div>
                        <code className="text-sm text-gray-300">{buyer.wallet}</code>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400">{buyer.qty} mints</span>
                        <span className="text-sm font-medium text-green-400">{buyer.spent}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 6: Activity Log */}
          {campaign.status !== 'draft' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                <button className="text-sm text-[#3B82F6] hover:text-[#3B82F6]/80 cursor-pointer">
                  View all in NFT Mints →
                </button>
              </div>
              <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-5">
                <div className="space-y-3 text-sm">
                  {[
                    { user: '0x742d...0bEb', action: 'minted 2 NFTs', time: '2 hours ago' },
                    { user: '0x8a3f...2c4d', action: 'minted 1 NFT', time: '4 hours ago' },
                    { user: '0x1bc9...7e8f', action: 'minted 1 NFT', time: '6 hours ago' },
                  ].map((activity, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-[#334155] last:border-0">
                      <div>
                        <code className="text-gray-300">{activity.user}</code>
                        <span className="text-gray-500"> {activity.action}</span>
                      </div>
                      <span className="text-gray-500">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
