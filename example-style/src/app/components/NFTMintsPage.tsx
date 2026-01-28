import { useState } from 'react';
import { Search, Calendar, Clock, RefreshCw } from 'lucide-react';
import { NFTMintsTable } from '@/app/components/NFTMintsTable';
import { NFTMintDetailDrawer } from '@/app/components/NFTMintDetailDrawer';

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

const mockMints: NFTMint[] = [
  {
    id: '1',
    walletAddress: '0x6f6e74d8c9b3e5a1f2c7d8e9f0a1b2c3d4e5f6a7',
    userId: 'lkja9n9k8m7j6h5g4f3d2s1a0z9x8w7v6u5t4r3e2w1q0',
    txHash: '0x46d0d2a8c9b3e5a1f2c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9',
    project: 'Loot Die',
    chain: 'Avalanche',
    qty: 2,
    salePhase: 'Public',
    amount: 140.00,
    mintedAt: 'Dec 22, 2025, 12:17 PM',
    tokenId: '1247',
    imageUrl: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=400&h=400&fit=crop',
  },
  {
    id: '2',
    walletAddress: '0x2cffaf8d4e5c1b2a3f4e5d6c7b8a9f0e1d2c3b4a',
    userId: 'p9o8i7u6y5t4r3e2w1q0z9x8c7v6b5n4m3l2k1j0i9',
    txHash: '0xec2c52b3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
    project: 'Loot Die',
    chain: 'Avalanche',
    qty: 1,
    salePhase: 'Allowlist',
    amount: 70.00,
    mintedAt: 'Dec 22, 2025, 11:48 AM',
    tokenId: '1246',
    imageUrl: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=400&h=400&fit=crop',
  },
  {
    id: '3',
    walletAddress: '0x633ca0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7',
    userId: 'h8g7f6d5s4a3z2x1c0v9b8n7m6l5k4j3h2g1f0d9s8',
    txHash: '0x1cf217d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6',
    project: 'Loot Die',
    chain: 'Avalanche',
    qty: 1,
    salePhase: 'Allowlist',
    amount: 70.00,
    mintedAt: 'Dec 21, 2025, 9:54 PM',
    tokenId: '1189',
    imageUrl: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=400&h=400&fit=crop',
  },
  {
    id: '4',
    walletAddress: '0xa4c2fd3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c',
    userId: 'a7s6d5f4g3h2j1k0l9z8x7c6v5b4n3m2q1w0e9r8t7',
    txHash: '0xe5abddc4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
    project: 'Mystery Bowl',
    chain: 'Avalanche',
    qty: 1,
    salePhase: null,
    amount: null,
    mintedAt: 'Dec 20, 2025, 3:22 PM',
    tokenId: '892',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=400&fit=crop',
  },
  {
    id: '5',
    walletAddress: '0x7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e',
    userId: 'y6u5i4o3p2l1k0j9h8g7f6d5s4a3z2x1c0v9b8n7m6',
    txHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    project: 'Loot Die',
    chain: 'Ethereum',
    qty: 3,
    salePhase: 'Public',
    amount: 210.00,
    mintedAt: 'Dec 20, 2025, 10:15 AM',
    tokenId: '856',
    imageUrl: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=400&h=400&fit=crop',
  },
  {
    id: '6',
    walletAddress: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    userId: 'l5k4j3h2g1f0d9s8a7z6x5c4v3b2n1m0q9w8e7r6t5',
    txHash: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
    project: 'Mystery Bowl',
    chain: 'Ethereum',
    qty: 1,
    salePhase: 'Allowlist',
    amount: 50.00,
    mintedAt: 'Dec 19, 2025, 5:40 PM',
    tokenId: '743',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=400&fit=crop',
  },
];

export function NFTMintsPage() {
  const [selectedMint, setSelectedMint] = useState<NFTMint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [chainFilter, setChainFilter] = useState('All');
  const [phaseFilter, setPhaseFilter] = useState('All');

  // Calculate summary stats
  const totalMints = mockMints.reduce((sum, mint) => sum + mint.qty, 0);
  const totalRevenue = mockMints.reduce((sum, mint) => sum + (mint.amount || 0), 0);
  const uniqueWallets = new Set(mockMints.map(m => m.walletAddress)).size;
  const uniqueProjects = new Set(mockMints.map(m => m.project)).size;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">NFT Mints</h1>
        <p className="text-gray-400">Track NFT mint transactions across all projects</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-2">Total Mints</div>
          <div className="text-3xl font-bold text-white">{totalMints.toLocaleString()}</div>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-2">Total Revenue</div>
          <div className="text-3xl font-bold text-white">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-2">Unique Wallets</div>
          <div className="text-3xl font-bold text-white">{uniqueWallets.toLocaleString()}</div>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-2">Projects</div>
          <div className="text-3xl font-bold text-white">{uniqueProjects}</div>
        </div>
      </div>

      {/* Data Freshness & Filters Bar */}
      <div className="space-y-3">
        {/* Data Freshness Indicator */}
        <div className="flex justify-end">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Data as of 2 min ago</span>
            </div>
            <button className="p-2 hover:bg-[#1E293B] rounded-lg transition-colors text-gray-400 hover:text-white">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Project Filter */}
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#A192F8]"
            >
              <option value="All">All Projects</option>
              <option value="Loot Die">Loot Die</option>
              <option value="Mystery Bowl">Mystery Bowl</option>
            </select>

            {/* Chain Filter */}
            <select
              value={chainFilter}
              onChange={(e) => setChainFilter(e.target.value)}
              className="bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#A192F8]"
            >
              <option value="All">All Chains</option>
              <option value="Avalanche">Avalanche</option>
              <option value="Ethereum">Ethereum</option>
            </select>

            {/* Phase Filter */}
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
              className="bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#A192F8]"
            >
              <option value="All">All Phases</option>
              <option value="Public">Public</option>
              <option value="Allowlist">Allowlist</option>
            </select>

            {/* Date Range */}
            <button className="bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-[#334155] transition-colors flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date Range
            </button>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by wallet or tx hash"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#A192F8]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden">
        <NFTMintsTable
          mints={mockMints}
          onMintClick={setSelectedMint}
        />
      </div>

      {/* Detail Drawer */}
      <NFTMintDetailDrawer
        mint={selectedMint}
        onClose={() => setSelectedMint(null)}
      />
    </div>
  );
}