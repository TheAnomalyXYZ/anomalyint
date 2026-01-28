import { useState } from 'react';
import { Copy, ExternalLink, RefreshCw, Download, Search } from 'lucide-react';

type EventType = 'SignUp' | 'SignIn' | 'FriendReferred' | 'Wager' | 'QuestCompleted';

type Transaction = {
  id: string;
  wallet: string;
  action: EventType;
  txId: string;
  timestamp: string;
};

const actionColors: Record<EventType, string> = {
  SignUp: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  SignIn: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  FriendReferred: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Wager: 'bg-green-500/20 text-green-400 border-green-500/30',
  QuestCompleted: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

// Mock data
const mockTransactions: Transaction[] = [
  {
    id: '1',
    wallet: '0x7e2c798a50bab777e0eeda042f962d29bc120581',
    action: 'SignUp',
    txId: '0x9c38e27f4e8b6c5a3d2f1e0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0',
    timestamp: 'Nov 29, 2025, 1:50:05 PM EST',
  },
  {
    id: '2',
    wallet: '0x6cb42e23edb7b5b4eeeaee46f854c842f0a941ab',
    action: 'FriendReferred',
    txId: '0xa72f2cc58d9e4f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5',
    timestamp: 'Nov 29, 2025, 1:49:59 PM EST',
  },
  {
    id: '3',
    wallet: '0x2ae45f67edd0f75390491d5909de244538c89975',
    action: 'Wager',
    txId: '0x9369f0be7c8d5a4b3e2f1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0',
    timestamp: 'Nov 29, 2025, 1:49:31 PM EST',
  },
  {
    id: '4',
    wallet: '0x4f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
    action: 'SignIn',
    txId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    timestamp: 'Nov 29, 2025, 1:48:22 PM EST',
  },
  {
    id: '5',
    wallet: '0x9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d',
    action: 'QuestCompleted',
    txId: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    timestamp: 'Nov 29, 2025, 1:47:15 PM EST',
  },
  {
    id: '6',
    wallet: '0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
    action: 'Wager',
    txId: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
    timestamp: 'Nov 29, 2025, 1:46:33 PM EST',
  },
  {
    id: '7',
    wallet: '0x3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c',
    action: 'SignUp',
    txId: '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
    timestamp: 'Nov 29, 2025, 1:45:01 PM EST',
  },
];

const eventCounts = {
  all: 2426964,
  SignUp: 184939,
  SignIn: 569992,
  FriendReferred: 81507,
  Wager: 1465767,
  QuestCompleted: 124759,
};

export function SomniaEventsPage() {
  const [selectedFilter, setSelectedFilter] = useState<EventType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const copyToClipboard = (text: string) => {
    // Fallback method for clipboard copy
    const textArea = document.createElement('textarea');
    textArea.value = text;
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

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const filteredTransactions =
    selectedFilter === 'all'
      ? mockTransactions
      : mockTransactions.filter((tx) => tx.action === selectedFilter);

  // Calculate metrics
  const mockData = mockTransactions;
  const signUpCount = mockData.filter(tx => tx.action === 'SignUp').length;
  const signInCount = mockData.filter(tx => tx.action === 'SignIn').length;
  const referralCount = mockData.filter(tx => tx.action === 'FriendReferred').length;
  const wagerCount = mockData.filter(tx => tx.action === 'Wager').length;
  const questCount = mockData.filter(tx => tx.action === 'QuestCompleted').length;

  const signUpPercentage = ((signUpCount / mockData.length) * 100).toFixed(2);
  const signInPercentage = ((signInCount / mockData.length) * 100).toFixed(2);
  const referralPercentage = ((referralCount / mockData.length) * 100).toFixed(2);
  const wagerPercentage = ((wagerCount / mockData.length) * 100).toFixed(2);
  const questPercentage = ((questCount / mockData.length) * 100).toFixed(2);

  return (
    <div className="h-full overflow-y-auto bg-[#0F172A] p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-white">Somnia Events</h1>
            <p className="text-gray-400 mt-1">On-chain transactions for Vectra on Somnia</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Data as of 2 min ago</span>
            <button className="p-2 hover:bg-[#1E293B] rounded-lg transition-colors cursor-pointer">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Contract Information Card */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6 mb-6">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Contract Information</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="text-xs text-gray-400 mb-2">Contract Address</div>
            <div className="flex items-center gap-2">
              <code className="text-sm text-white bg-[#0F172A] px-3 py-1.5 rounded break-all">
                0x59b53161d00825009053cc8F4848dc20f398cE99
              </code>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => copyToClipboard('0x59b53161d00825009053cc8F4848dc20f398cE99')}
                  className="p-1.5 hover:bg-[#334155] rounded transition-colors cursor-pointer"
                  title="Copy address"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
                <a
                  href="https://explorer.somnia.network/address/0x59b53161d00825009053cc8F4848dc20f398cE99"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-[#334155] rounded transition-colors cursor-pointer"
                  title="View on explorer"
                >
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-2">Network</div>
            <div className="text-sm text-white">Somnia Mainnet</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-2">Network Status</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
              <span className="text-sm text-[#22C55E]">Healthy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-5">
          <div className="text-xs text-gray-400 mb-1">Total Events</div>
          <div className="text-2xl font-bold text-white">{mockData.length}</div>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-5">
          <div className="text-xs text-gray-400 mb-1">SignUps</div>
          <div className="text-2xl font-bold text-white">{signUpCount}</div>
          <div className="text-xs text-gray-400 mt-1">{signUpPercentage}%</div>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-5">
          <div className="text-xs text-gray-400 mb-1">SignIns</div>
          <div className="text-2xl font-bold text-white">{signInCount}</div>
          <div className="text-xs text-gray-400 mt-1">{signInPercentage}%</div>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-5">
          <div className="text-xs text-gray-400 mb-1">Referrals</div>
          <div className="text-2xl font-bold text-white">{referralCount}</div>
          <div className="text-xs text-gray-400 mt-1">{referralPercentage}%</div>
          <div className="text-xs text-[#22C55E] mt-1">+23%</div>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-5">
          <div className="text-xs text-gray-400 mb-1">Wagers</div>
          <div className="text-2xl font-bold text-white">{wagerCount}</div>
          <div className="text-xs text-gray-400 mt-1">{wagerPercentage}%</div>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-5">
          <div className="text-xs text-gray-400 mb-1">Quests</div>
          <div className="text-2xl font-bold text-white">{questCount}</div>
          <div className="text-xs text-gray-400 mt-1">{questPercentage}%</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            selectedFilter === 'all'
              ? 'bg-[#3B82F6] text-white'
              : 'bg-[#1E293B] border border-[#334155] text-gray-300 hover:bg-[#334155]'
          }`}
        >
          All
          <span className="text-xs opacity-80">({eventCounts.all.toLocaleString()})</span>
        </button>
        <button
          onClick={() => setSelectedFilter('SignUp')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            selectedFilter === 'SignUp'
              ? 'bg-[#3B82F6] text-white'
              : 'bg-[#1E293B] border border-[#334155] text-gray-300 hover:bg-[#334155]'
          }`}
        >
          SignUp
          <span className="text-xs opacity-80">({eventCounts.SignUp.toLocaleString()})</span>
        </button>
        <button
          onClick={() => setSelectedFilter('SignIn')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            selectedFilter === 'SignIn'
              ? 'bg-[#3B82F6] text-white'
              : 'bg-[#1E293B] border border-[#334155] text-gray-300 hover:bg-[#334155]'
          }`}
        >
          SignIn
          <span className="text-xs opacity-80">({eventCounts.SignIn.toLocaleString()})</span>
        </button>
        <button
          onClick={() => setSelectedFilter('FriendReferred')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            selectedFilter === 'FriendReferred'
              ? 'bg-[#3B82F6] text-white'
              : 'bg-[#1E293B] border border-[#334155] text-gray-300 hover:bg-[#334155]'
          }`}
        >
          FriendReferred
          <span className="text-xs opacity-80">
            ({eventCounts.FriendReferred.toLocaleString()})
          </span>
        </button>
        <button
          onClick={() => setSelectedFilter('Wager')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            selectedFilter === 'Wager'
              ? 'bg-[#3B82F6] text-white'
              : 'bg-[#1E293B] border border-[#334155] text-gray-300 hover:bg-[#334155]'
          }`}
        >
          Wager
          <span className="text-xs opacity-80">({eventCounts.Wager.toLocaleString()})</span>
        </button>
        <button
          onClick={() => setSelectedFilter('QuestCompleted')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            selectedFilter === 'QuestCompleted'
              ? 'bg-[#3B82F6] text-white'
              : 'bg-[#1E293B] border border-[#334155] text-gray-300 hover:bg-[#334155]'
          }`}
        >
          QuestCompleted
          <span className="text-xs opacity-80">
            ({eventCounts.QuestCompleted.toLocaleString()})
          </span>
        </button>
      </div>

      {/* Additional Filters Bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by wallet address or tx ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1E293B] border border-[#334155] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]"
          />
        </div>
        <input
          type="date"
          className="bg-[#1E293B] border border-[#334155] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#3B82F6]"
        />
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1E293B] border border-[#334155] hover:bg-[#334155] text-gray-300 rounded-lg text-sm transition-colors cursor-pointer">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Transaction Log Table */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0F172A] sticky top-0">
              <tr>
                <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">
                  User (Wallet Address)
                </th>
                <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">Action</th>
                <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">
                  Transaction ID
                </th>
                <th className="text-left text-xs font-medium text-gray-400 px-6 py-4">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#1E293B]/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-white">{tx.wallet}</code>
                      <button
                        onClick={() => copyToClipboard(tx.wallet)}
                        className="p-1 hover:bg-[#334155] rounded transition-colors cursor-pointer"
                      >
                        <Copy className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                        actionColors[tx.action]
                      }`}
                    >
                      {tx.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={`https://explorer.somnia.network/tx/${tx.txId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#3B82F6] hover:text-[#3B82F6]/80 cursor-pointer"
                    >
                      <code>{truncateHash(tx.txId)}</code>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{tx.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-[#334155] px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing 1-7 of {filteredTransactions.length.toLocaleString()} transactions
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-[#0F172A] border border-[#334155] hover:bg-[#334155] text-gray-300 rounded text-sm transition-colors cursor-pointer">
              Previous
            </button>
            <button className="px-3 py-1.5 bg-[#3B82F6] text-white rounded text-sm transition-colors cursor-pointer">
              1
            </button>
            <button className="px-3 py-1.5 bg-[#0F172A] border border-[#334155] hover:bg-[#334155] text-gray-300 rounded text-sm transition-colors cursor-pointer">
              2
            </button>
            <button className="px-3 py-1.5 bg-[#0F172A] border border-[#334155] hover:bg-[#334155] text-gray-300 rounded text-sm transition-colors cursor-pointer">
              3
            </button>
            <button className="px-3 py-1.5 bg-[#0F172A] border border-[#334155] hover:bg-[#334155] text-gray-300 rounded text-sm transition-colors cursor-pointer">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}