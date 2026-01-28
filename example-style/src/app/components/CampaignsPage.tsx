import { useState } from 'react';
import {
  RefreshCw,
  Plus,
  Calendar,
  ChevronDown,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
} from 'lucide-react';
import { CampaignCard } from '@/app/components/CampaignCard';
import { CampaignDetailDrawer } from '@/app/components/CampaignDetailDrawer';
import { CreateCampaignModal } from '@/app/components/CreateCampaignModal';
import { PageHeader, SearchInput, DataFreshness, FilterButton } from '@/app/components/base';
import { ColorfulMetricCard } from '@/app/components/ColorfulMetricCard';

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

// Mock campaign data
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Loot Die NFT Drop',
    status: 'ended',
    game: 'Dont Die',
    chain: 'Avalanche',
    image: 'https://images.unsplash.com/photo-1633738033267-854e592919df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWNlJTIwZ2FtaW5nJTIwbG9vdHxlbnwxfHx8fDE3NjkwMDg1Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    revenue: '$4,270',
    mints: 31,
    participants: 17,
    dateRange: 'Dec 21-22, 2025',
    phases: '2 phases (Allowlist + Public)',
    contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    description: 'Limited edition Loot Die NFTs featuring exclusive in-game items and benefits.',
  },
  {
    id: '2',
    name: 'Mystery Bowl Collection',
    status: 'ended',
    game: 'GMeow',
    chain: 'Ethereum',
    image: 'https://images.unsplash.com/photo-1602161761511-e46be065278d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXQlMjBib3dsJTIwbXlzdGVyeXxlbnwxfHx8fDE3NjkwMDg1Mzl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    revenue: null,
    mints: 15,
    participants: 12,
    dateRange: 'Oct 2025',
    contractAddress: '0x9a3f5c8e2d1b4a7e6f8c9d0e1f2a3b4c5d6e7f8',
    description: 'Mysterious bowl NFTs with hidden rewards and surprises.',
  },
  {
    id: '3',
    name: 'Neura Knights Genesis',
    status: 'draft',
    game: 'Neura Knights',
    chain: 'Somnia',
    image: 'https://images.unsplash.com/photo-1732198678426-00f5ba98e5b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpZXZhbCUyMGtuaWdodCUyMGFybW9yfGVufDF8fHx8MTc2OTAwODUzOXww&ixlib=rb-4.1.0&q=80&w=1080',
    revenue: null,
    mints: null,
    participants: null,
    dateRange: 'Not scheduled',
    description: 'Genesis knights with unique abilities and rare traits.',
  },
  {
    id: '4',
    name: 'Goonville Land Sale',
    status: 'scheduled',
    game: 'Goonville',
    chain: 'Ethereum',
    image: 'https://images.unsplash.com/photo-1570096124900-cd10784e684d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW50YXN5JTIwbGFuZCUyMHByb3BlcnR5fGVufDF8fHx8MTc2OTAwODUzOXww&ixlib=rb-4.1.0&q=80&w=1080',
    revenue: null,
    mints: null,
    participants: null,
    dateRange: 'Starts Feb 1, 2026',
    progress: {
      current: 0,
      total: 500,
    },
    contractAddress: '0x1bc9e5f7d8a6b4c3d2e1f0a9b8c7d6e5f4a3b2c1',
    description: 'Virtual land plots in the heart of Goonville.',
  },
];

export function CampaignsPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [gameFilter, setGameFilter] = useState('All');
  const [chainFilter, setChainFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate summary stats
  const activeCampaigns = mockCampaigns.filter((c) => c.status === 'active').length;
  const upcomingCampaigns = mockCampaigns.filter((c) => c.status === 'scheduled').length;
  const totalRevenue = mockCampaigns
    .filter((c) => c.revenue)
    .reduce((sum, c) => {
      const revenue = parseInt(c.revenue!.replace(/[$,]/g, ''));
      return sum + revenue;
    }, 0);
  const totalParticipants = mockCampaigns
    .filter((c) => c.participants)
    .reduce((sum, c) => sum + (c.participants || 0), 0);

  // Filter campaigns
  const filteredCampaigns = mockCampaigns.filter((campaign) => {
    if (statusFilter !== 'All' && campaign.status !== statusFilter.toLowerCase()) return false;
    if (gameFilter !== 'All' && campaign.game !== gameFilter) return false;
    if (chainFilter !== 'All' && campaign.chain !== chainFilter) return false;
    if (searchQuery && !campaign.name.toLowerCase().includes(searchQuery.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="flex-1 overflow-auto p-6 bg-transparent">
      {/* Header */}
      <PageHeader
        title="Campaigns"
        subtitle="Create and manage NFT drops, sales, and promotions"
        actions={
          <FilterButton
            icon={<Plus className="w-5 h-5" />}
            label="Create Campaign"
            onClick={() => setIsCreateModalOpen(true)}
            variant="primary"
          />
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <ColorfulMetricCard
          title="Active Campaigns"
          value={activeCampaigns}
          subtitle="Currently running"
          color="lime"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <ColorfulMetricCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          subtitle="All-time across all campaigns"
          color="peach"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <ColorfulMetricCard
          title="Total Participants"
          value={totalParticipants}
          subtitle="Unique users"
          color="pink"
          icon={<Users className="w-5 h-5" />}
        />
        <ColorfulMetricCard
          title="Upcoming"
          value={upcomingCampaigns}
          subtitle="Scheduled but not started"
          color="blue"
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Data Freshness */}
      <div className="mb-6">
        <DataFreshness timestamp="2 min ago" />
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-3">
        {/* Search Bar - Full Width */}
        <div>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by campaign name"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-card border border-default rounded-lg pl-3 pr-10 py-2.5 text-sm text-primary hover:bg-hover transition-colors cursor-pointer focus:outline-none focus:border-[#A192F8]"
            >
              <option>All</option>
              <option>Draft</option>
              <option>Scheduled</option>
              <option>Active</option>
              <option>Ended</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none" />
          </div>

          {/* Game Filter */}
          <div className="relative">
            <select
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
              className="appearance-none bg-card border border-default rounded-lg pl-3 pr-10 py-2.5 text-sm text-primary hover:bg-hover transition-colors cursor-pointer focus:outline-none focus:border-[#A192F8]"
            >
              <option>All</option>
              <option>Dont Die</option>
              <option>GMeow</option>
              <option>Goonville</option>
              <option>MooFO</option>
              <option>Vectra</option>
              <option>Neura Knights</option>
              <option>Synapse</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none" />
          </div>

          {/* Chain Filter */}
          <div className="relative">
            <select
              value={chainFilter}
              onChange={(e) => setChainFilter(e.target.value)}
              className="appearance-none bg-card border border-default rounded-lg pl-3 pr-10 py-2.5 text-sm text-primary hover:bg-hover transition-colors cursor-pointer focus:outline-none focus:border-[#A192F8]"
            >
              <option>All</option>
              <option>Avalanche</option>
              <option>Ethereum</option>
              <option>Solana</option>
              <option>Aptos</option>
              <option>Somnia</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none" />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none bg-card border border-default rounded-lg pl-3 pr-10 py-2.5 text-sm text-primary hover:bg-hover transition-colors cursor-pointer focus:outline-none focus:border-[#A192F8]"
            >
              <option>All</option>
              <option>NFT Drop</option>
              <option>Token Sale</option>
              <option>Allowlist Mint</option>
              <option>Public Sale</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none" />
          </div>

          {/* Date Range */}
          <button className="bg-card border border-default rounded-lg px-3 py-2.5 text-sm text-primary hover:bg-hover transition-colors flex items-center gap-2 cursor-pointer">
            <Calendar className="w-4 h-4" />
            Date Range
          </button>
        </div>
      </div>

      {/* Campaign Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            onViewDetails={setSelectedCampaign}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <p className="text-secondary mb-4">No campaigns found matching your filters</p>
          <button
            onClick={() => {
              setStatusFilter('All');
              setGameFilter('All');
              setChainFilter('All');
              setTypeFilter('All');
              setSearchQuery('');
            }}
            className="text-sm text-[#A192F8] hover:text-[#9178E8] cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Detail Drawer */}
      <CampaignDetailDrawer
        campaign={selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
      />

      {/* Create Campaign Modal */}
      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}