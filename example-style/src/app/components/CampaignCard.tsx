import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

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
};

type CampaignCardProps = {
  campaign: Campaign;
  onViewDetails: (campaign: Campaign) => void;
};

const statusConfig = {
  active: { label: 'Active', color: 'bg-[#22C55E] text-white' },
  ended: { label: 'Ended', color: 'bg-gray-600 text-gray-200' },
  scheduled: { label: 'Scheduled', color: 'bg-[#3B82F6] text-white' },
  draft: { label: 'Draft', color: 'bg-[#F59E0B] text-white' },
};

const gameColors: Record<string, string> = {
  'Dont Die': 'bg-red-500/20 text-red-400 border-red-500/30',
  'GMeow': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Goonville': 'bg-green-500/20 text-green-400 border-green-500/30',
  'MooFO': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Vectra': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Neura Knights': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  'Synapse': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

const chainColors: Record<string, string> = {
  'Avalanche': '#E84142',
  'Ethereum': '#627EEA',
  'Solana': '#14F195',
  'Aptos': '#00FFA3',
  'Somnia': '#9C27B0',
};

export function CampaignCard({ campaign, onViewDetails }: CampaignCardProps) {
  const statusStyle = statusConfig[campaign.status];
  const gameColor = gameColors[campaign.game] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg overflow-hidden hover:border-[#3B82F6] transition-all hover:shadow-lg hover:shadow-[#3B82F6]/10">
      {/* Status Badge */}
      <div className="relative">
        <ImageWithFallback
          src={campaign.image}
          alt={campaign.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle.color}`}>
            {statusStyle.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Name */}
        <h3 className="text-lg font-semibold text-white truncate">{campaign.name}</h3>

        {/* Game and Chain */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-1 rounded text-xs font-medium border ${gameColor}`}>
            {campaign.game}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: chainColors[campaign.chain] || '#666' }}
            />
            <span>{campaign.chain}</span>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#334155]">
          <div>
            <div className="text-xs text-gray-500">Revenue</div>
            <div className="text-sm font-medium text-white mt-1">
              {campaign.revenue || '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Mints</div>
            <div className="text-sm font-medium text-white mt-1">
              {campaign.mints !== null ? campaign.mints : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Users</div>
            <div className="text-sm font-medium text-white mt-1">
              {campaign.participants !== null ? campaign.participants : '—'}
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="text-xs text-gray-400 pt-2 border-t border-[#334155]">
          {campaign.dateRange}
        </div>

        {/* Progress Bar (if active) */}
        {campaign.progress && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Progress</span>
              <span className="text-gray-300">
                {campaign.progress.current} / {campaign.progress.total}
              </span>
            </div>
            <div className="w-full bg-[#0F172A] rounded-full h-2">
              <div
                className="bg-[#3B82F6] h-2 rounded-full transition-all"
                style={{
                  width: `${(campaign.progress.current / campaign.progress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Phases Info */}
        {campaign.phases && (
          <div className="text-xs text-gray-400">{campaign.phases}</div>
        )}

        {/* Action Button */}
        <button
          onClick={() => onViewDetails(campaign)}
          className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            campaign.status === 'draft'
              ? 'bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white'
              : 'bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white'
          }`}
        >
          {campaign.status === 'draft' ? 'Edit Draft' : 'View Details'}
        </button>
      </div>
    </div>
  );
}
