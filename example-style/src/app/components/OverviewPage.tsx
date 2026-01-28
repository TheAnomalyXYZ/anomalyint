import { RefreshCw, Users, TrendingUp, DollarSign, Zap, Target, Award } from 'lucide-react';
import { ColorfulMetricCard } from '@/app/components/ColorfulMetricCard';
import { AlertCard } from '@/app/components/AlertCard';
import { RecentTransactions } from '@/app/components/RecentTransactions';
import { RecentCampaigns } from '@/app/components/RecentCampaigns';

export function OverviewPage() {
  return (
    <div className="p-3 bg-transparent min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[28px] font-semibold text-primary mb-2">Overview</h1>
          <p className="text-secondary">Monitor your platform's key metrics and activity</p>
        </div>
        <button className="px-5 py-2.5 bg-[#A192F8] text-white rounded-lg text-sm font-medium hover:bg-[#9178E8] transition-colors flex items-center gap-2 cursor-pointer">
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Refresh Data</span>
        </button>
      </div>

      {/* Colorful Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <ColorfulMetricCard
          title="Total Users"
          value="184,939"
          subtitle="+12% vs last week"
          color="lime"
          icon={<Users className="w-5 h-5" />}
        />
        <ColorfulMetricCard
          title="Revenue"
          value="$4,270"
          subtitle="+8% vs last month"
          color="peach"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <ColorfulMetricCard
          title="Active Users"
          value="12,450"
          subtitle="Daily average"
          color="blue"
          icon={<Zap className="w-5 h-5" />}
        />
        <ColorfulMetricCard
          title="Transactions"
          value="2.4M"
          subtitle="All time"
          color="pink"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <ColorfulMetricCard
          title="Referrals"
          value="81,507"
          subtitle="+23% vs last month"
          color="mint"
          icon={<Target className="w-5 h-5" />}
        />
        <ColorfulMetricCard
          title="Quest Completions"
          value="124,759"
          subtitle="+10% vs last week"
          color="purple"
          icon={<Award className="w-5 h-5" />}
        />
      </div>

      {/* Alerts */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-primary mb-3">Alerts & Notifications</h2>
        <div className="space-y-2">
          <AlertCard
            type="warning"
            title="High traffic detected"
            message="User activity has increased by 45% in the last hour. Monitor server capacity."
            timestamp="2 minutes ago"
          />
          <AlertCard
            type="info"
            title="Campaign performance update"
            message="'Summer NFT Drop' campaign has reached 80% of target engagement."
            timestamp="15 minutes ago"
          />
        </div>
      </div>

      {/* Activity Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentTransactions />
        <RecentCampaigns />
      </div>
    </div>
  );
}