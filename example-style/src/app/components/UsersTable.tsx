import { useState } from 'react';
import { Copy, Check, Mail, Send, Wallet } from 'lucide-react';

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

interface UsersTableProps {
  users: User[];
  selectedUsers: Set<string>;
  onSelectUser: (userId: string) => void;
  onSelectAll: () => void;
  onUserClick: (user: User) => void;
  isLoading?: boolean;
  visibleColumns?: Record<string, boolean>;
}

export function UsersTable({ 
  users, 
  selectedUsers, 
  onSelectUser, 
  onSelectAll,
  onUserClick,
  isLoading = false,
  visibleColumns = {},
}: UsersTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    // Fallback for environments where clipboard API is blocked
    try {
      // Try using the Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback: create a temporary textarea element
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      // If clipboard API fails, use fallback method
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch (fallbackError) {
        console.warn('All copy methods failed:', fallbackError);
      }
    }
  };

  const getGameColor = (game: string) => {
    const colors: Record<string, string> = {
      'Neura Knights': 'bg-purple-500/10 text-purple-400',
      'Goonville': 'bg-green-500/10 text-green-400',
      'GMeow': 'bg-orange-500/10 text-orange-400',
      'Vectra': 'bg-blue-500/10 text-blue-400',
      'Moo.F.O.': 'bg-pink-500/10 text-pink-400',
      'Dont Die': 'bg-red-500/10 text-red-400',
      'Synapse': 'bg-cyan-500/10 text-cyan-400',
    };
    return colors[game] || 'bg-gray-500/10 text-gray-400';
  };

  const getChainIcon = (chain: string) => {
    // Simple letter badges for chains
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#A192F8]/20 text-[#A192F8] text-xs font-semibold">
        {chain[0]}
      </span>
    );
  };

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const LoginMethodIcon = ({ method, active, label }: { method: string; active: boolean; label: string }) => {
    const colorClass = active ? 'text-[#A192F8]' : 'text-gray-600 opacity-40';
    
    let icon;
    switch (method) {
      case 'google':
        icon = (
          <svg className={`w-4 h-4 transition-colors ${colorClass}`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        );
        break;
      case 'email':
        icon = <Mail className={`w-4 h-4 transition-colors ${colorClass}`} />;
        break;
      case 'telegram':
        icon = <Send className={`w-4 h-4 transition-colors ${colorClass}`} />;
        break;
      case 'discord':
        icon = (
          <svg className={`w-4 h-4 transition-colors ${colorClass}`} viewBox="0 0 127 96" fill="currentColor">
            <path d="M81.15,0c-1.2376,2.1973-2.3489,4.4704-3.3591,6.794-9.5975-1.4396-19.3718-1.4396-28.9945,0-.985-2.3236-2.1216-4.5967-3.3591-6.794-9.0166,1.5407-17.8059,4.2431-26.1405,8.0568C2.779,32.5304-1.6914,56.3725.5312,79.8863c9.6732,7.1476,20.5083,12.603,32.0505,16.0884,2.6014-3.4854,4.8998-7.1981,6.8698-11.0623-3.738-1.3891-7.3497-3.1318-10.8098-5.1523.9092-.6567,1.7932-1.3386,2.6519-1.9953,20.281,9.547,43.7696,9.547,64.0758,0,.8587.7072,1.7427,1.3891,2.6519,1.9953-3.4601,2.0457-7.0718,3.7632-10.835,5.1776,1.97,3.8642,4.2683,7.5769,6.8698,11.0623,11.5419-3.4854,22.3769-8.9156,32.0509-16.0631,2.626-27.2771-4.496-50.9172-18.817-71.8548C98.9811,4.2684,90.1918,1.5659,81.1752.0505l-.0252-.0505ZM42.2802,65.4144c-6.2383,0-11.4159-5.6575-11.4159-12.6535s4.9755-12.6788,11.3907-12.6788,11.5169,5.708,11.4159,12.6788c-.101,6.9708-5.026,12.6535-11.3907,12.6535ZM84.3576,65.4144c-6.2637,0-11.3907-5.6575-11.3907-12.6535s4.9755-12.6788,11.3907-12.6788,11.4917,5.708,11.3906,12.6788c-.101,6.9708-5.026,12.6535-11.3906,12.6535Z"/>
          </svg>
        );
        break;
      case 'wallet':
        icon = <Wallet className={`w-4 h-4 transition-colors ${colorClass}`} />;
        break;
      default:
        return null;
    }

    return (
      <div className="relative group/icon">
        <div className="flex items-center justify-center w-5 h-5">
          {icon}
        </div>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          {label}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-12 bg-hover rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#e5e7eb]">
            <th className="px-3 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedUsers.size === users.length && users.length > 0}
                onChange={onSelectAll}
                className="w-4 h-4 rounded border-gray-600 bg-card text-[#A192F8]"
              />
            </th>
            {visibleColumns.userId && <th className="px-3 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wide">User ID</th>}
            {visibleColumns.email && <th className="px-3 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wide">Email</th>}
            {visibleColumns.loginMethods && <th className="px-3 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wide">Login Methods</th>}
            {visibleColumns.kyc && <th className="px-3 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wide">KYC</th>}
            {visibleColumns.privyWallet && <th className="px-3 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wide">Privy Wallet</th>}
            {visibleColumns.connectedWallets && <th className="px-3 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wide">Connected Wallets</th>}
            {visibleColumns.fordefiWallet && <th className="px-3 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wide">Fordefi Wallet</th>}
            {visibleColumns.games && <th className="px-3 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wide">Games</th>}
            {visibleColumns.ipAddress && <th className="px-3 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wide">IP Address</th>}
            {visibleColumns.asn && <th className="px-3 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wide">ASN</th>}
            {visibleColumns.created && <th className="px-3 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wide">Created</th>}
            {visibleColumns.lastActive && <th className="px-3 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wide">Last Active</th>}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className={`border-b border-[#e5e7eb] hover:bg-[#F5F7FA] transition-colors group cursor-pointer ${ 
                !user.privyWallet ? 'bg-[#EF4444]/5' : ''
              }`}
              onClick={() => onUserClick(user)}
            >
              <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedUsers.has(user.id)}
                  onChange={() => onSelectUser(user.id)}
                  className="w-4 h-4 rounded border-gray-600 bg-card text-[#A192F8]"
                />
              </td>
              {visibleColumns.userId && (
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-secondary">{user.id}</code>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(user.id, user.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {copiedId === user.id ? (
                        <Check className="w-3 h-3 text-[#22C55E]" />
                      ) : (
                        <Copy className="w-3 h-3 text-secondary hover:text-primary" />
                      )}
                    </button>
                  </div>
                </td>
              )}
              {visibleColumns.email && <td className="px-3 py-3 text-[#1a1a2e] font-medium">{user.email}</td>}
              {visibleColumns.loginMethods && (
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <LoginMethodIcon method="google" active={user.loginMethods.google} label="Google" />
                    <LoginMethodIcon method="email" active={user.loginMethods.email} label="Email" />
                    <LoginMethodIcon method="telegram" active={user.loginMethods.telegram} label="Telegram" />
                    <LoginMethodIcon method="discord" active={user.loginMethods.discord} label="Discord" />
                    <LoginMethodIcon method="wallet" active={user.loginMethods.wallet} label="Wallet" />
                  </div>
                </td>
              )}
              {visibleColumns.kyc && (
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      user.kycLevel === 'L2'
                        ? 'bg-[#22C55E]/10 text-[#22C55E]'
                        : user.kycLevel === 'L1'
                        ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                        : 'bg-gray-500/10 text-gray-400'
                    }`}
                  >
                    {user.kycLevel}
                  </span>
                </td>
              )}
              {visibleColumns.privyWallet && (
                <td className="px-3 py-3">
                  {user.privyWallet ? (
                    <code className="text-xs text-[#6b7280]">{truncateAddress(user.privyWallet)}</code>
                  ) : (
                    <span className="text-xs text-[#EF4444] font-medium">None</span>
                  )}
                </td>
              )}
              {visibleColumns.connectedWallets && (
                <td className="px-3 py-3">
                  {user.connectedWallets?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {user.connectedWallets.map((wallet, idx) => (
                        <span key={idx} className="text-xs bg-[#A192F8]/10 text-[#A192F8] px-2 py-0.5 rounded">
                          {wallet.chain}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-[#6b7280]">—</span>
                  )}
                </td>
              )}
              {visibleColumns.fordefiWallet && (
                <td className="px-3 py-3">
                  {user.fordefiWallet ? (
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-[#6b7280]">{truncateAddress(user.fordefiWallet)}</code>
                      <span className="text-xs text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded">Fordefi</span>
                    </div>
                  ) : (
                    <span className="text-xs text-[#6b7280]">—</span>
                  )}
                </td>
              )}
              {visibleColumns.games && (
                <td className="px-3 py-3">
                  {user.games?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {user.games.slice(0, 2).map((game) => (
                        <span key={game} className={`text-xs ${getGameColor(game)} px-2 py-0.5 rounded`}>
                          {game}
                        </span>
                      ))}
                      {user.games.length > 2 && (
                        <span className="text-xs bg-gray-100 text-[#6b7280] px-1.5 py-0.5 rounded">+{user.games.length - 2}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-[#6b7280]">—</span>
                  )}
                </td>
              )}
              {visibleColumns.ipAddress && (
                <td className="px-3 py-3">
                  <code className="text-xs text-[#6b7280]">{user.ipAddress}</code>
                </td>
              )}
              {visibleColumns.asn && <td className="px-3 py-3 text-[#6b7280]">{user.asn}</td>}
              {visibleColumns.created && <td className="px-3 py-3 text-[#6b7280] text-xs">{user.created}</td>}
              {visibleColumns.lastActive && <td className="px-3 py-3 text-[#6b7280] text-xs">{user.lastActive}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}