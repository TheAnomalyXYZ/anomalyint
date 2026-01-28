import { useState } from 'react';
import { Share2, Download, Copy, TrendingUp, TrendingDown } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Mock data for charts
const userGrowthData = [
  { date: 'Jan 15', users: 120000 },
  { date: 'Jan 20', users: 135000 },
  { date: 'Jan 25', users: 152000 },
  { date: 'Jan 30', users: 168000 },
  { date: 'Feb 4', users: 184939 },
];

const dailyActiveUsersData = [
  { date: 'Jan 15', users: 12500 },
  { date: 'Jan 20', users: 14200 },
  { date: 'Jan 25', users: 13800 },
  { date: 'Jan 30', users: 15600 },
  { date: 'Feb 4', users: 16200 },
];

const transactionVolumeData = [
  { date: 'Jan 15', SignUp: 8000, SignIn: 25000, Wager: 45000, Quest: 5000, Referral: 3000 },
  { date: 'Jan 20', SignUp: 9200, SignIn: 28000, Wager: 52000, Quest: 6200, Referral: 3500 },
  { date: 'Jan 25', SignUp: 10500, SignIn: 32000, Wager: 58000, Quest: 7100, Referral: 4200 },
  { date: 'Jan 30', SignUp: 11800, SignIn: 35000, Wager: 63000, Quest: 8300, Referral: 4800 },
  { date: 'Feb 4', SignUp: 12900, SignIn: 38000, Wager: 68000, Quest: 9200, Referral: 5400 },
];

const actionBreakdownData = [
  { name: 'SignUp', value: 184939, color: '#3B82F6' },
  { name: 'SignIn', value: 569992, color: '#6B7280' },
  { name: 'FriendReferred', value: 81507, color: '#8B5CF6' },
  { name: 'Wager', value: 1465767, color: '#22C55E' },
  { name: 'QuestCompleted', value: 124759, color: '#F59E0B' },
];

const topPerformers = [
  {
    rank: 1,
    wallet: '0x7e2c798a50bab777e0eeda042f962d29bc120581',
    totalActions: 1547,
    wagers: 892,
    referrals: 23,
  },
  {
    rank: 2,
    wallet: '0x6cb42e23edb7b5b4eeeaee46f854c842f0a941ab',
    totalActions: 1289,
    wagers: 756,
    referrals: 18,
  },
  {
    rank: 3,
    wallet: '0x2ae45f67edd0f75390491d5909de244538c89975',
    totalActions: 1124,
    wagers: 687,
    referrals: 15,
  },
  {
    rank: 4,
    wallet: '0x4f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
    totalActions: 987,
    wagers: 534,
    referrals: 12,
  },
  {
    rank: 5,
    wallet: '0x9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d',
    totalActions: 876,
    wagers: 489,
    referrals: 9,
  },
];

export function SomniaDashboardPage() {
  const [dateRange, setDateRange] = useState('30days');
  const [isShareLinkActive, setIsShareLinkActive] = useState(true);

  const copyShareLink = () => {
    const link = 'https://dashboard.connectnova.link/somnia';
    const textArea = document.createElement('textarea');
    textArea.value = link;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Failed to copy:', err);
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const truncateWallet = (wallet: string) => {
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0F172A] p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Somnia Dashboard</h1>
            <p className="text-gray-400">Performance metrics for grant reporting</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isShareLinkActive ? 'bg-[#22C55E]' : 'bg-gray-500'}`} />
              <span className="text-gray-400">
                {isShareLinkActive ? 'Public link active' : 'Link disabled'}
              </span>
              <label className="relative inline-block w-9 h-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isShareLinkActive}
                  onChange={(e) => setIsShareLinkActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-full h-full bg-gray-600 peer-checked:bg-[#3B82F6] rounded-full peer transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-transform" />
              </label>
            </div>
            <button
              onClick={copyShareLink}
              className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] border border-[#334155] hover:bg-[#334155] text-gray-300 rounded-lg text-sm transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              Share Link
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white rounded-lg text-sm transition-colors cursor-pointer">
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDateRange('7days')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              dateRange === '7days'
                ? 'bg-[#3B82F6] text-white'
                : 'bg-[#1E293B] border border-[#334155] text-gray-300 hover:bg-[#334155]'
            }`}
          >
            Last 7 days
          </button>
          <button
            onClick={() => setDateRange('30days')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              dateRange === '30days'
                ? 'bg-[#3B82F6] text-white'
                : 'bg-[#1E293B] border border-[#334155] text-gray-300 hover:bg-[#334155]'
            }`}
          >
            Last 30 days
          </button>
          <button
            onClick={() => setDateRange('90days')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              dateRange === '90days'
                ? 'bg-[#3B82F6] text-white'
                : 'bg-[#1E293B] border border-[#334155] text-gray-300 hover:bg-[#334155]'
            }`}
          >
            Last 90 days
          </button>
          <button
            onClick={() => setDateRange('alltime')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              dateRange === 'alltime'
                ? 'bg-[#3B82F6] text-white'
                : 'bg-[#1E293B] border border-[#334155] text-gray-300 hover:bg-[#334155]'
            }`}
          >
            All time
          </button>
          <button
            onClick={() => setDateRange('custom')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              dateRange === 'custom'
                ? 'bg-[#3B82F6] text-white'
                : 'bg-[#1E293B] border border-[#334155] text-gray-300 hover:bg-[#334155]'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm text-gray-400 mb-2">Total Users</div>
              <div className="text-3xl font-bold text-white">184,939</div>
            </div>
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <TrendingUp className="w-4 h-4" />
              +15%
            </div>
          </div>
          {/* Sparkline */}
          <svg className="w-full h-8" viewBox="0 0 100 20">
            <polyline
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              points="0,15 20,12 40,8 60,10 80,5 100,3"
            />
          </svg>
        </div>

        <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm text-gray-400 mb-2">Total Transactions</div>
              <div className="text-3xl font-bold text-white">2,426,964</div>
            </div>
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <TrendingUp className="w-4 h-4" />
              +12%
            </div>
          </div>
          <svg className="w-full h-8" viewBox="0 0 100 20">
            <polyline
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              points="0,18 20,14 40,11 60,9 80,7 100,4"
            />
          </svg>
        </div>

        <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm text-gray-400 mb-2">Daily Active Users</div>
              <div className="text-3xl font-bold text-white">16,200</div>
            </div>
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <TrendingUp className="w-4 h-4" />
              +8%
            </div>
          </div>
          <svg className="w-full h-8" viewBox="0 0 100 20">
            <polyline
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              points="0,12 20,10 40,13 60,9 80,7 100,6"
            />
          </svg>
        </div>

        <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm text-gray-400 mb-2">Total Wagers</div>
              <div className="text-3xl font-bold text-white">1,465,767</div>
            </div>
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <TrendingUp className="w-4 h-4" />
              +18%
            </div>
          </div>
          <svg className="w-full h-8" viewBox="0 0 100 20">
            <polyline
              fill="none"
              stroke="#22C55E"
              strokeWidth="2"
              points="0,16 20,13 40,10 60,8 80,6 100,4"
            />
          </svg>
        </div>

        <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm text-gray-400 mb-2">Referral Conversions</div>
              <div className="text-3xl font-bold text-white">81,507</div>
            </div>
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <TrendingUp className="w-4 h-4" />
              +22%
            </div>
          </div>
          <svg className="w-full h-8" viewBox="0 0 100 20">
            <polyline
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="2"
              points="0,14 20,12 40,9 60,11 80,7 100,5"
            />
          </svg>
        </div>

        <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm text-gray-400 mb-2">Quest Completions</div>
              <div className="text-3xl font-bold text-white">124,759</div>
            </div>
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <TrendingUp className="w-4 h-4" />
              +10%
            </div>
          </div>
          <svg className="w-full h-8" viewBox="0 0 100 20">
            <polyline
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2"
              points="0,15 20,13 40,12 60,10 80,8 100,6"
            />
          </svg>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* User Growth */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
              />
              <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Active Users */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Daily Active Users</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyActiveUsersData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="users" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Transaction Volume */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Transaction Volume</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={transactionVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
              />
              <Area type="monotone" dataKey="SignUp" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
              <Area type="monotone" dataKey="SignIn" stackId="1" stroke="#6B7280" fill="#6B7280" />
              <Area type="monotone" dataKey="Wager" stackId="1" stroke="#22C55E" fill="#22C55E" />
              <Area type="monotone" dataKey="Quest" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
              <Area
                type="monotone"
                dataKey="Referral"
                stackId="1"
                stroke="#8B5CF6"
                fill="#8B5CF6"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Action Breakdown */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Action Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={actionBreakdownData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={(entry) => `${entry.name}: ${((entry.value / 2426964) * 100).toFixed(1)}%`}
              >
                {actionBreakdownData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performers Table */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-3xl overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-[#334155]">
          <h3 className="text-lg font-semibold text-white">Top Users by Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0F172A]">
              <tr>
                <th className="text-left text-xs font-medium text-gray-400 px-6 py-3">Rank</th>
                <th className="text-left text-xs font-medium text-gray-400 px-6 py-3">
                  Wallet Address
                </th>
                <th className="text-left text-xs font-medium text-gray-400 px-6 py-3">
                  Total Actions
                </th>
                <th className="text-left text-xs font-medium text-gray-400 px-6 py-3">Wagers</th>
                <th className="text-left text-xs font-medium text-gray-400 px-6 py-3">
                  Referrals
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]">
              {topPerformers.map((user) => (
                <tr key={user.rank} className="hover:bg-[#1E293B]/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#3B82F6]/20 text-[#3B82F6] font-semibold text-sm">
                      {user.rank}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-white">{truncateWallet(user.wallet)}</code>
                      <button
                        onClick={() => navigator.clipboard.writeText(user.wallet)}
                        className="p-1 hover:bg-[#334155] rounded transition-colors cursor-pointer"
                      >
                        <Copy className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-white font-medium">
                    {user.totalActions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {user.wagers.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {user.referrals.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grant Milestone Tracker */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Grant Milestone Tracker</h3>
        <div className="space-y-5">
          {/* Milestone 1 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white">10,000 users</span>
              <span className="text-sm text-gray-400">8,500 / 10,000</span>
            </div>
            <div className="w-full bg-[#0F172A] rounded-full h-2">
              <div className="bg-[#3B82F6] h-2 rounded-full" style={{ width: '85%' }} />
            </div>
            <div className="text-xs text-gray-500 mt-1">85% complete</div>
          </div>

          {/* Milestone 2 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white">1M transactions</span>
              <span className="text-sm text-gray-400">920,000 / 1,000,000</span>
            </div>
            <div className="w-full bg-[#0F172A] rounded-full h-2">
              <div className="bg-[#3B82F6] h-2 rounded-full" style={{ width: '92%' }} />
            </div>
            <div className="text-xs text-gray-500 mt-1">92% complete</div>
          </div>

          {/* Milestone 3 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white">Launch by Q1 2026</span>
              <span className="text-sm text-green-400 flex items-center gap-1">
                ✓ Complete
              </span>
            </div>
            <div className="w-full bg-[#0F172A] rounded-full h-2">
              <div className="bg-[#22C55E] h-2 rounded-full" style={{ width: '100%' }} />
            </div>
            <div className="text-xs text-green-400 mt-1">100% complete</div>
          </div>
        </div>
      </div>
    </div>
  );
}