interface Campaign {
  name: string;
  game: string;
  status: 'active' | 'paused' | 'completed';
  revenue: string;
  participants: number;
}

const campaigns: Campaign[] = [
  { name: 'Season 2 Launch', game: 'Neura Knights', status: 'active', revenue: '$42,350', participants: 1247 },
  { name: 'New Player Bonus', game: 'Goonville', status: 'active', revenue: '$28,920', participants: 892 },
  { name: 'Weekend Event', game: 'GMeow', status: 'completed', revenue: '$15,680', participants: 543 },
  { name: 'Referral Campaign', game: 'Vectra', status: 'active', revenue: '$31,240', participants: 678 },
  { name: 'Beta Test', game: 'Synapse', status: 'paused', revenue: '$8,450', participants: 234 },
];

export function RecentCampaigns() {
  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20';
      case 'paused':
        return 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20';
      case 'completed':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="bg-card rounded-3xl p-6 border border-default shadow-card">
      <h2 className="text-xl font-semibold text-primary mb-4">Recent Campaigns</h2>
      
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-default">
              <th className="text-left py-3 px-2 text-xs font-medium text-secondary uppercase">Name</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-secondary uppercase">Game</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-secondary uppercase">Status</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-secondary uppercase">Revenue</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-secondary uppercase">Participants</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign, index) => (
              <tr key={index} className="border-b border-default hover:bg-hover transition-colors">
                <td className="py-3 px-2 text-sm text-primary font-medium">{campaign.name}</td>
                <td className="py-3 px-2 text-sm text-secondary">{campaign.game}</td>
                <td className="py-3 px-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </span>
                </td>
                <td className="py-3 px-2 text-sm text-primary text-right font-medium">{campaign.revenue}</td>
                <td className="py-3 px-2 text-sm text-secondary text-right">{campaign.participants.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}