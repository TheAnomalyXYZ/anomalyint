import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface User {
  id: string;
  email: string;
  loginMethods: {
    google: boolean;
    email: boolean;
    telegram: boolean;
    discord: boolean;
    wallet: boolean;
  };
  kycLevel: 'None' | 'L1' | 'L2';
  privyWallet?: string;
  connectedWallets: Array<{ chain: 'Somnia' | 'Avalanche' | 'Aptos' | 'Ethereum'; address: string }>;
  fordefiWallet?: string;
  games: string[];
  ipAddress: string;
  asn: string;
  created: string;
  lastActive: string;
}

interface UserDetailDrawerProps {
  user: User | null;
  onClose: () => void;
}

type Message = {
  id: string;
  timestamp: string;
  channel: 'telegram' | 'email';
  preview: string;
  fullMessage: string;
  status: 'delivered' | 'pending' | 'failed';
};

// Mock message data
const mockMessages: Message[] = [
  {
    id: '1',
    timestamp: 'Jan 20, 2026 10:15 AM',
    channel: 'telegram',
    preview: 'Hey gamer_pro! 👋 Welcome to Dont Die. You\'re all...',
    fullMessage: 'Hey gamer_pro! 👋\n\nWelcome to Dont Die. You\'re all set to start playing.\n\nNeed help? Check out our guide or ask in the community.',
    status: 'delivered',
  },
  {
    id: '2',
    timestamp: 'Jan 18, 2026 3:00 PM',
    channel: 'telegram',
    preview: '🎮 New Event Alert! Winter Championship is now...',
    fullMessage: '🎮 New Event Alert!\n\nWinter Championship is now live in Dont Die.\n\nDon\'t miss out — ends Jan 25, 2026.',
    status: 'delivered',
  },
  {
    id: '3',
    timestamp: 'Jan 15, 2026 11:00 AM',
    channel: 'telegram',
    preview: '🎁 You\'ve earned a reward! 500 credits have bee...',
    fullMessage: '🎁 You\'ve earned a reward!\n\n500 credits have been added to your account.\n\nKeep playing to earn more!',
    status: 'delivered',
  },
  {
    id: '4',
    timestamp: 'Jan 12, 2026 9:30 AM',
    channel: 'telegram',
    preview: 'Your KYC verification has been approved! You ca...',
    fullMessage: 'Your KYC verification has been approved! You can now access all features.',
    status: 'delivered',
  },
  {
    id: '5',
    timestamp: 'Jan 10, 2026 2:00 PM',
    channel: 'telegram',
    preview: 'Welcome to Novalink! Your account is ready.',
    fullMessage: 'Welcome to Novalink! Your account is ready. Start exploring our games and features.',
    status: 'failed',
  },
];

export function UserDetailDrawer({ user, onClose }: UserDetailDrawerProps) {
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);

  if (!user) return null;

  const statusConfig = {
    delivered: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Delivered' },
    pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Pending' },
    failed: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Failed' },
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[600px] bg-[#1E293B] border-l border-[#334155] z-50 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">User Details</h2>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* User ID */}
            <div>
              <label className="text-xs text-gray-400 uppercase mb-2 block">User ID</label>
              <code className="text-sm text-white bg-[#0F172A] px-3 py-2 rounded block">{user.id}</code>
            </div>

            {/* KYC Level */}
            <div>
              <label className="text-xs text-gray-400 uppercase mb-2 block">KYC Level</label>
              <span
                className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${
                  user.kycLevel === 'L2'
                    ? 'bg-[#22C55E]/10 text-[#22C55E]'
                    : user.kycLevel === 'L1'
                    ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                    : 'bg-gray-500/10 text-gray-400'
                }`}
              >
                {user.kycLevel}
              </span>
            </div>

            {/* Wallets */}
            <div>
              <label className="text-xs text-gray-400 uppercase mb-2 block">Wallets</label>
              <div className="space-y-2">
                {user.privyWallet ? (
                  <div className="bg-[#0F172A] p-3 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#A192F8]">Privy Wallet</span>
                    </div>
                    <code className="text-sm text-white">{user.privyWallet}</code>
                  </div>
                ) : (
                  <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 p-3 rounded">
                    <span className="text-sm text-[#EF4444]">No Privy Wallet</span>
                  </div>
                )}

                {user.connectedWallets.map((wallet) => (
                  <div key={wallet.chain} className="bg-[#0F172A] p-3 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#A192F8]">Connected Wallet ({wallet.chain})</span>
                    </div>
                    <code className="text-sm text-white">{wallet.address}</code>
                  </div>
                ))}

                {user.fordefiWallet && (
                  <div className="bg-[#0F172A] p-3 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#22C55E]">Fordefi Wallet</span>
                    </div>
                    <code className="text-sm text-white">{user.fordefiWallet}</code>
                  </div>
                )}
              </div>
            </div>

            {/* Games */}
            <div>
              <label className="text-xs text-gray-400 uppercase mb-2 block">Games</label>
              <div className="flex flex-wrap gap-2">
                {user.games.map((game) => (
                  <span key={game} className="text-sm bg-[#334155] text-gray-300 px-3 py-1 rounded">
                    {game}
                  </span>
                ))}
              </div>
            </div>

            {/* Network Info */}
            <div>
              <label className="text-xs text-gray-400 uppercase mb-2 block">Network Information</label>
              <div className="bg-[#0F172A] p-3 rounded space-y-2">
                <div>
                  <span className="text-xs text-gray-400">IP Address</span>
                  <code className="text-sm text-white block">{user.ipAddress}</code>
                </div>
                <div>
                  <span className="text-xs text-gray-400">ASN</span>
                  <div className="text-sm text-white">{user.asn}</div>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 uppercase mb-2 block">Created</label>
                <div className="text-sm text-white">{user.created}</div>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase mb-2 block">Last Active</label>
                <div className="text-sm text-white">{user.lastActive}</div>
              </div>
            </div>

            {/* Message History */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs text-gray-400 uppercase">Message History</label>
                <span className="text-xs text-gray-500">{mockMessages.length} messages sent</span>
              </div>
              <div className="bg-[#0F172A] border border-[#334155] rounded-lg divide-y divide-[#334155]">
                {mockMessages.map((message) => (
                  <div key={message.id} className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {/* Telegram Icon */}
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0088cc">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                        </svg>
                        <span className="text-xs text-gray-400">{message.timestamp}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded border ${statusConfig[message.status].color}`}>
                        {statusConfig[message.status].label}
                      </span>
                    </div>
                    
                    {expandedMessageId === message.id ? (
                      <div>
                        <div className="text-sm text-white whitespace-pre-wrap mb-2">
                          {message.fullMessage}
                        </div>
                        <button
                          onClick={() => setExpandedMessageId(null)}
                          className="flex items-center gap-1 text-xs text-[#A192F8] hover:text-[#A192F8]/80 cursor-pointer"
                        >
                          <ChevronUp className="w-3 h-3" />
                          Show less
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm text-gray-300 mb-2">{message.preview}</div>
                        <button
                          onClick={() => setExpandedMessageId(message.id)}
                          className="flex items-center gap-1 text-xs text-[#A192F8] hover:text-[#A192F8]/80 cursor-pointer"
                        >
                          <ChevronDown className="w-3 h-3" />
                          View full message
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-[#334155]">
            <button className="flex-1 px-4 py-2 bg-[#A192F8] text-white rounded-lg text-sm font-medium hover:bg-[#9178E8] transition-colors cursor-pointer">
              Message User
            </button>
            <button className="flex-1 px-4 py-2 bg-[#0F172A] border border-[#334155] text-gray-300 rounded-lg text-sm font-medium hover:bg-[#334155] transition-colors cursor-pointer">
              View Activity
            </button>
          </div>
        </div>
      </div>
    </>
  );
}