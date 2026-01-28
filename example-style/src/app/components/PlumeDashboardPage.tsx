// Plume Dashboard Page - reusing Somnia template structure
import { useState } from 'react';
import { TrendingUp, Users, DollarSign, Activity, Copy, ExternalLink } from 'lucide-react';

export function PlumeDashboardPage() {
  const [dateRange, setDateRange] = useState('30days');
  const [isShareLinkActive, setIsShareLinkActive] = useState(true);

  const metrics = [
    { label: 'Total Transactions', value: '145,234', change: '+12.5%', icon: Activity, color: 'from-blue-500 to-cyan-500' },
    { label: 'Active Users', value: '8,456', change: '+8.2%', icon: Users, color: 'from-purple-500 to-pink-500' },
    { label: 'Volume', value: '$2.4M', change: '+18.7%', icon: DollarSign, color: 'from-green-500 to-emerald-500' },
    { label: 'Growth Rate', value: '+24.3%', change: '+5.1%', icon: TrendingUp, color: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Plume Dashboard</h1>
        <p className="text-secondary">Shareable metrics and performance insights</p>
      </div>

      {/* Share Controls */}
      <div className="bg-card backdrop-blur-sm rounded-2xl p-6 border border-default mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isShareLinkActive}
                onChange={(e) => setIsShareLinkActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-[#0F172A] text-[#A192F8]"
              />
              <span className="text-sm font-medium text-primary">Public Share Link</span>
            </label>
            
            {isShareLinkActive && (
              <button className="flex items-center gap-2 px-4 py-2 bg-[#A192F8]/10 text-[#A192F8] rounded-lg text-sm font-medium hover:bg-[#A192F8]/20 transition-colors">
                <Copy className="w-4 h-4" />
                Copy Link
              </button>
            )}
          </div>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#A192F8]"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-card backdrop-blur-sm rounded-2xl p-6 border border-default">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-green-400 font-medium">{metric.change}</span>
              </div>
              <h3 className="text-2xl font-bold text-primary mb-1">{metric.value}</h3>
              <p className="text-sm text-secondary">{metric.label}</p>
            </div>
          );
        })}
      </div>

      {/* Chart Placeholder */}
      <div className="bg-card backdrop-blur-sm rounded-2xl p-6 border border-default">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-primary">Transaction Volume</h3>
          <button className="flex items-center gap-2 text-sm text-secondary hover:text-[#A192F8] transition-colors">
            <ExternalLink className="w-4 h-4" />
            View Full Report
          </button>
        </div>
        
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-default rounded-lg">
          <p className="text-secondary">Chart visualization coming soon</p>
        </div>
      </div>
    </div>
  );
}
