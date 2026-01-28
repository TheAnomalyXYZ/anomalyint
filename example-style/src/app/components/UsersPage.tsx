import { useState, useRef } from 'react';
import { Filter, Columns, RefreshCw, Download, MessageSquare, Gift } from 'lucide-react';
import { UsersTable } from '@/app/components/UsersTable';
import { FiltersPanel } from '@/app/components/FiltersPanel';
import { ColumnsDropdown } from '@/app/components/ColumnsDropdown';
import { UserDetailDrawer } from '@/app/components/UserDetailDrawer';
import { PageHeader, SearchInput, FilterButton, DataFreshness, DataCard } from '@/app/components/base';

// Mock data
const mockUsers = [
  {
    id: 'lkja9n9kq01kqopyl2v2qclk',
    email: 'user847@icloud.com',
    loginMethods: {
      google: false,
      email: true,
      telegram: false,
      discord: false,
      wallet: true,
    },
    kycLevel: 'None' as const,
    privyWallet: undefined,
    connectedWallets: [{ chain: 'Ethereum' as const, address: '0x9f2a8b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e7b1e' }],
    fordefiWallet: undefined,
    games: ['Neura Knights', 'Goonville'],
    ipAddress: '192.168.1.45',
    asn: 'SingTel',
    created: '2024-01-15 14:32',
    lastActive: '2 min ago',
  },
  {
    id: 'nasfyaf7w08ixm9tn4k1pqrs',
    email: 'player@gmail.com',
    loginMethods: {
      google: true,
      email: false,
      telegram: false,
      discord: true,
      wallet: true,
    },
    kycLevel: 'L1' as const,
    privyWallet: '0x8c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b9e2f',
    connectedWallets: [{ chain: 'Somnia' as const, address: '0x4a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f5c8d' }],
    fordefiWallet: '0x1f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e7d9b',
    games: ['GMeow', 'Vectra', 'Neura Knights'],
    ipAddress: '10.0.0.123',
    asn: 'AWS',
    created: '2024-01-10 09:15',
    lastActive: '1 hour ago',
  },
  {
    id: 'h8t21waskhmt7y3bz5n6vwxc',
    email: 'gamer99@outlook.com',
    loginMethods: {
      google: false,
      email: true,
      telegram: true,
      discord: false,
      wallet: false,
    },
    kycLevel: 'L2' as const,
    privyWallet: '0x2c5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d8a1b',
    connectedWallets: [{ chain: 'Avalanche' as const, address: '0x6d4e5f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c3b2c' }],
    fordefiWallet: undefined,
    games: ['Goonville'],
    ipAddress: '172.16.0.88',
    asn: 'Rogers',
    created: '2023-12-28 18:45',
    lastActive: '5 min ago',
  },
  // Power user example
  {
    id: 'cdz45boamlws9g2hf8j3kpqt',
    email: 'whale@proton.me',
    loginMethods: {
      google: true,
      email: false,
      telegram: true,
      discord: false,
      wallet: true,
    },
    kycLevel: 'L2' as const,
    privyWallet: '0x7b3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b4e8f',
    connectedWallets: [
      { chain: 'Ethereum' as const, address: '0x9c2a3b4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f1f7d' },
      { chain: 'Aptos' as const, address: '0x3e5d6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c9b2a' },
    ],
    fordefiWallet: '0x3e5d6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c9b2a',
    games: ['Neura Knights', 'GMeow', 'Vectra', 'Synapse'],
    ipAddress: '203.45.67.89',
    asn: 'Verizon',
    created: '2023-11-05 12:20',
    lastActive: 'Just now',
  },
  {
    id: 'user84823z9c1r4d6m8p0qwxs',
    email: 'user848@icloud.com',
    loginMethods: {
      google: false,
      email: true,
      telegram: false,
      discord: false,
      wallet: false,
    },
    kycLevel: 'None' as const,
    privyWallet: undefined,
    connectedWallets: [],
    fordefiWallet: undefined,
    games: [],
    ipAddress: '192.168.1.46',
    asn: 'SingTel',
    created: '2024-01-15 14:35',
    lastActive: '10 min ago',
  },
];

export function UsersPage() {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isFiltersPanelOpen, setIsFiltersPanelOpen] = useState(false);
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    userId: true,
    email: true,
    loginMethods: true,
    kyc: true,
    privyWallet: true,
    connectedWallets: true,
    fordefiWallet: true,
    games: true,
    ipAddress: true,
    asn: true,
    created: true,
    lastActive: true,
  });
  const columnsButtonRef = useRef<HTMLButtonElement>(null);

  const handleToggleColumn = (columnId: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === mockUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(mockUsers.map((u) => u.id)));
    }
  };

  return (
    <div className="p-3 bg-transparent min-h-full">
      {/* Header */}
      <PageHeader
        title="Users"
        subtitle="Manage and monitor user accounts"
      />

      {/* Controls Bar */}
      <div className="mb-6 space-y-3">
        {/* Search Bar - Full Width */}
        <div>
          <SearchInput
            placeholder="Search by email, wallet, IP, or user ID"
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-3">
          <FilterButton
            icon={<Filter className="w-4 h-4" />}
            label="Filters"
            onClick={() => setIsFiltersPanelOpen(true)}
          />
          <div className="relative">
            <button
              ref={columnsButtonRef}
              onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
              className="px-4 py-2.5 bg-card border border-default rounded-lg text-sm text-primary hover:bg-hover transition-colors flex items-center gap-2"
            >
              <Columns className="w-4 h-4" />
              Columns
            </button>
            <ColumnsDropdown
              isOpen={isColumnsDropdownOpen}
              onClose={() => setIsColumnsDropdownOpen(false)}
              onToggleColumn={handleToggleColumn}
              visibleColumns={visibleColumns}
              buttonRef={columnsButtonRef}
            />
          </div>
          <button className="p-2.5 bg-card border border-default rounded-lg text-secondary hover:bg-hover transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-[#A192F8]/10 border border-[#A192F8]/30 rounded-lg">
            <span className="text-sm text-primary font-medium">{selectedUsers.size} selected</span>
            <div className="flex items-center gap-2 ml-auto">
              <button className="px-3 py-1.5 bg-[#A192F8] text-white rounded-lg text-sm font-medium hover:bg-[#9178E8] transition-colors flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Message Selected
              </button>
              <button className="px-3 py-1.5 bg-card border border-default text-primary rounded-lg text-sm font-medium hover:bg-hover transition-colors flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Gift Credits
              </button>
              <button className="px-3 py-1.5 bg-card border border-default text-primary rounded-lg text-sm font-medium hover:bg-hover transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Data Freshness */}
      <div className="mb-4">
        <DataFreshness
          timestamp="2 min ago"
          showCount
          count={mockUsers.length}
        />
      </div>

      {/* Table */}
      <DataCard padding="none">
        <UsersTable
          users={mockUsers}
          selectedUsers={selectedUsers}
          onSelectUser={handleSelectUser}
          onSelectAll={handleSelectAll}
          onUserClick={setSelectedUser}
          isLoading={false}
          visibleColumns={visibleColumns}
        />
      </DataCard>

      {/* Filters Panel */}
      <FiltersPanel
        isOpen={isFiltersPanelOpen}
        onClose={() => setIsFiltersPanelOpen(false)}
      />

      {/* User Detail Drawer */}
      <UserDetailDrawer
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}