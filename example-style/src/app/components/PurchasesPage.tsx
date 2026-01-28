import { useState } from 'react';
import { Search, Calendar, Clock, RefreshCw } from 'lucide-react';
import { PurchasesTable } from '@/app/components/PurchasesTable';
import { PurchaseDetailDrawer } from '@/app/components/PurchaseDetailDrawer';

interface Purchase {
  id: string;
  type: 'Stars' | 'Crypto';
  userId: string;
  game: string;
  item: string;
  qty: number;
  amount: number;
  currency: string;
  platform: string;
  status: string;
  txId: string;
  createdAt: string;
  chain?: string;
  itemEmoji?: string;
  itemPrice?: string;
}

const mockPurchases: Purchase[] = [
  {
    id: '1',
    type: 'Stars',
    userId: 'ndhaqliz8m7j6h5g4f3d2s1a0z9x8w7v6u5t4r3e2w1q0',
    game: 'Goonville',
    item: 'GoldPouch',
    qty: 1,
    amount: 100,
    currency: '⭐ Stars',
    platform: 'Telegram',
    status: 'completed',
    txId: 'stxFe_h9a8b7c6d5e4f3g2h1i0j9k8l7m6n5o4p3q2r1s0',
    createdAt: 'Dec 31, 2025, 2:32 PM',
  },
  {
    id: '2',
    type: 'Crypto',
    userId: 'sw6alttf7u6y5t4r3e2w1q0z9x8c7v6b5n4m3l2k1j0i9',
    game: 'MooFO',
    item: 'Golden Cow',
    itemEmoji: '🐄',
    itemPrice: '$2.00',
    qty: 1,
    amount: 2.00,
    currency: 'USDC',
    platform: 'Sophon',
    chain: 'Sophon',
    status: 'succeeded',
    txId: '0x81a17a948c9b3e5a1f2c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
    createdAt: 'Jul 24, 2025, 10:35 AM',
  },
  {
    id: '3',
    type: 'Stars',
    userId: 'a1r6a59p2o1i9u8y7t6r5e4w3q2z1x0c9v8b7n6m5l4k3',
    game: 'GMeow',
    item: 'FIVE CATS',
    qty: 5,
    amount: 1250,
    currency: '⭐ Stars',
    platform: 'Telegram',
    status: 'completed',
    txId: 'stxnecrl5k4j3h2g1f0d9s8a7z6x5c4v3b2n1m0l9k8j7h6',
    createdAt: 'Dec 10, 2025, 5:30 PM',
  },
  {
    id: '4',
    type: 'Crypto',
    userId: 'gp6dhuz39w8e7r6t5y4u3i2o1p0l9k8j7h6g5f4d3s2a1z0',
    game: 'MooFO',
    item: 'Golden Cow',
    itemEmoji: '🐄',
    itemPrice: '$1.50',
    qty: 10,
    amount: 15.00,
    currency: 'USDC',
    platform: 'Sophon',
    chain: 'Sophon',
    status: 'succeeded',
    txId: '0x05ea17d9e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
    createdAt: 'Jul 4, 2025, 2:51 PM',
  },
  {
    id: '5',
    type: 'Stars',
    userId: 'kk7sirf72s1a0z9x8w7v6u5t4r3e2w1q0p9o8i7u6y5t4r3',
    game: 'GMeow',
    item: 'SINGLE CAT',
    qty: 1,
    amount: 250,
    currency: '⭐ Stars',
    platform: 'Telegram',
    status: 'completed',
    txId: 'stxAbc123def456ghi789jkl012mno345pqr678stu901vwx234',
    createdAt: 'Dec 28, 2025, 9:15 AM',
  },
  {
    id: '6',
    type: 'Crypto',
    userId: 'yz8xyz123abc456def789ghi012jkl345mno678pqr901stu234',
    game: 'GMeow',
    item: 'PET ACTIONS',
    qty: 3,
    amount: 5.00,
    currency: 'USDC',
    platform: 'Base',
    chain: 'Base',
    status: 'succeeded',
    txId: '0xabcdef123456789012345678901234567890123456789012345678901234',
    createdAt: 'Dec 15, 2025, 4:20 PM',
  },
  {
    id: '7',
    type: 'Stars',
    userId: 'pending123user456test789demo012example345sample678',
    game: 'Goonville',
    item: 'GoldPouch',
    qty: 2,
    amount: 200,
    currency: '⭐ Stars',
    platform: 'Telegram',
    status: 'pending',
    txId: 'stxPending123test456demo789sample012example345',
    createdAt: 'Jan 1, 2026, 8:00 AM',
  },
  {
    id: '8',
    type: 'Crypto',
    userId: 'failed456user789test012demo345example678sample901',
    game: 'MooFO',
    item: 'Golden Cow',
    itemEmoji: '🐄',
    itemPrice: '$2.00',
    qty: 1,
    amount: 2.00,
    currency: 'USDC',
    platform: 'Base',
    chain: 'Base',
    status: 'failed',
    txId: '0xfailed123456789012345678901234567890123456789012345678',
    createdAt: 'Dec 20, 2025, 11:45 AM',
  },
];

export function PurchasesPage() {
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('All');
  const [gameFilter, setGameFilter] = useState('All');
  const [itemFilter, setItemFilter] = useState('All');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Calculate summary stats
  const totalPurchases = mockPurchases.length;
  const totalRevenue = mockPurchases.reduce((sum, purchase) => {
    // Convert Stars to USD (approximate: 1 Star ≈ $0.01)
    if (purchase.type === 'Stars') {
      return sum + (purchase.amount * 0.01);
    }
    return sum + purchase.amount;
  }, 0);
  const uniqueBuyers = new Set(mockPurchases.map(p => p.userId)).size;
  const paymentMethods = new Set(mockPurchases.map(p => p.type)).size;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Purchases</h1>
        <p className="text-gray-400">In-game purchases via Stars and crypto</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-2">Total Purchases</div>
          <div className="text-3xl font-bold text-white">{totalPurchases.toLocaleString()}</div>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-2">Total Revenue</div>
          <div className="text-3xl font-bold text-white">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-2">Unique Buyers</div>
          <div className="text-3xl font-bold text-white">{uniqueBuyers.toLocaleString()}</div>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-6">
          <div className="text-sm text-gray-400 mb-2">Payment Methods</div>
          <div className="text-3xl font-bold text-white">{paymentMethods}</div>
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
            <button className="p-2 hover:bg-[#1E293B] rounded-lg transition-colors text-gray-400 hover:text-white cursor-pointer">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
            {/* Payment Type Filter */}
            <select
              value={paymentTypeFilter}
              onChange={(e) => setPaymentTypeFilter(e.target.value)}
              className="bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#A192F8]"
            >
              <option value="All">All Types</option>
              <option value="Stars">Stars</option>
              <option value="Crypto">Crypto</option>
            </select>

            {/* Game Filter */}
            <select
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
              className="bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#A192F8]"
            >
              <option value="All">All Games</option>
              <option value="GMeow">GMeow</option>
              <option value="Goonville">Goonville</option>
              <option value="MooFO">MooFO</option>
            </select>

            {/* Item Filter */}
            <select
              value={itemFilter}
              onChange={(e) => setItemFilter(e.target.value)}
              className="bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#A192F8]"
            >
              <option value="All">All Items</option>
              <option value="Golden Cow">Golden Cow</option>
              <option value="GoldPouch">GoldPouch</option>
              <option value="PET ACTIONS">PET ACTIONS</option>
              <option value="SINGLE CAT">SINGLE CAT</option>
              <option value="FIVE CATS">FIVE CATS</option>
            </select>

            {/* Platform Filter */}
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#A192F8]"
            >
              <option value="All">All Platforms</option>
              <option value="Telegram">Telegram</option>
              <option value="Sophon">Sophon</option>
              <option value="Base">Base</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#A192F8]"
            >
              <option value="All">All Status</option>
              <option value="completed">Completed</option>
              <option value="succeeded">Succeeded</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            {/* Date Range */}
            <button className="bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-[#334155] transition-colors flex items-center gap-2 cursor-pointer">
              <Calendar className="w-4 h-4" />
              Date Range
            </button>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user ID or tx ID"
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
        <PurchasesTable
          purchases={mockPurchases}
          onPurchaseClick={setSelectedPurchase}
        />
      </div>

      {/* Detail Drawer */}
      <PurchaseDetailDrawer
        purchase={selectedPurchase}
        onClose={() => setSelectedPurchase(null)}
      />
    </div>
  );
}