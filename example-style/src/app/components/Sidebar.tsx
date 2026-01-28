import { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Wallet,
  ArrowRightLeft,
  Megaphone,
  MessageSquare,
  ShieldAlert,
  FileText,
  Settings,
  LogOut,
  ChevronUp,
  ChevronDown,
  Image,
} from 'lucide-react';
import A from '@/imports/A';
import { ThemeToggle } from '@/app/components/ThemeToggle';

interface SidebarProps {
  activeItem?: string;
  onNavigate?: (itemId: string) => void;
}

export function Sidebar({ activeItem = 'overview', onNavigate }: SidebarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [isPartnerPagesOpen, setIsPartnerPagesOpen] = useState(false);
  const [isSomniaOpen, setIsSomniaOpen] = useState(false);
  const [isPlumeOpen, setIsPlumeOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'wallets', label: 'Wallets', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'messaging', label: 'Messaging', icon: MessageSquare },
  ];

  const transactionSubmenu = [
    { id: 'nftmints', label: 'NFT Mints', icon: Image },
  ];

  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    console.log('Logout clicked');
    // Add logout logic here
  };

  return (
    <aside className="w-20 lg:w-64 bg-transparent flex flex-col p-2">
      {/* Single Framed Container */}
      <div className="flex-1 bg-card backdrop-blur-sm rounded-3xl px-2 py-4 lg:p-4 flex flex-col">
        {/* Logo */}
        <div className="pb-4 mb-4 border-b border-default">
          <button
            onClick={() => onNavigate?.('overview')}
            className="flex items-center justify-center lg:justify-start gap-3 hover:opacity-80 transition-opacity cursor-pointer w-full"
          >
            <div className="w-8 flex-shrink-0">
              <A />
            </div>
            <span className="text-xl font-semibold text-primary hidden lg:block">Novalink</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <div className="space-y-1 flex flex-col items-center lg:items-stretch">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              return (
                <button
                  key={item.id}
                  className={`flex items-center justify-center lg:justify-start lg:gap-3 lg:px-4 lg:py-3 w-10 h-10 lg:w-full lg:h-auto rounded-full lg:rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#A192F8] text-white'
                      : 'text-secondary hover:bg-hover hover:text-primary'
                  }`}
                  onClick={() => onNavigate?.(item.id)}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="hidden lg:inline">{item.label}</span>
                </button>
              );
            })}

            {/* Partner Pages - Expandable */}
            <div className="w-full">
              <button
                onClick={() => setIsPartnerPagesOpen(!isPartnerPagesOpen)}
                className="flex items-center justify-center lg:justify-start lg:gap-3 lg:px-4 lg:py-3 w-10 h-10 lg:w-full lg:h-auto rounded-full lg:rounded-lg text-sm font-medium transition-colors text-secondary hover:bg-hover hover:text-primary cursor-pointer mx-auto lg:mx-0"
              >
                <FileText className="w-5 h-5 flex-shrink-0" />
                <span className="hidden lg:inline">Partner Pages</span>
                {isPartnerPagesOpen ? (
                  <ChevronUp className="w-4 h-4 ml-auto hidden lg:block" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-auto hidden lg:block" />
                )}
              </button>

              {/* Partner Pages Submenu */}
              {isPartnerPagesOpen && (
                <div className="hidden lg:block ml-4 mt-1 space-y-1">
                  {/* Somnia */}
                  <div>
                    <button
                      onClick={() => setIsSomniaOpen(!isSomniaOpen)}
                      className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-secondary hover:bg-hover hover:text-primary transition-colors cursor-pointer"
                    >
                      {isSomniaOpen ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3 -rotate-90" />
                      )}
                      Somnia
                    </button>
                    {isSomniaOpen && (
                      <div className="ml-5 mt-1 space-y-1">
                        <button
                          onClick={() => onNavigate?.('somnia-events')}
                          className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                            activeItem === 'somnia-events'
                              ? 'bg-[#A192F8] text-white'
                              : 'text-muted hover:bg-hover hover:text-primary'
                          }`}
                        >
                          Events
                        </button>
                        <button
                          onClick={() => onNavigate?.('somnia-dashboard')}
                          className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                            activeItem === 'somnia-dashboard'
                              ? 'bg-[#A192F8] text-white'
                              : 'text-muted hover:bg-hover hover:text-primary'
                          }`}
                        >
                          Dashboard
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Plume */}
                  <div>
                    <button
                      onClick={() => setIsPlumeOpen(!isPlumeOpen)}
                      className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-secondary hover:bg-hover hover:text-primary transition-colors cursor-pointer"
                    >
                      {isPlumeOpen ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3 -rotate-90" />
                      )}
                      Plume
                    </button>
                    {isPlumeOpen && (
                      <div className="ml-5 mt-1 space-y-1">
                        <button
                          onClick={() => onNavigate?.('plume-events')}
                          className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                            activeItem === 'plume-events'
                              ? 'bg-[#A192F8] text-white'
                              : 'text-muted hover:bg-hover hover:text-primary'
                          }`}
                        >
                          Events
                        </button>
                        <button
                          onClick={() => onNavigate?.('plume-dashboard')}
                          className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                            activeItem === 'plume-dashboard'
                              ? 'bg-[#A192F8] text-white'
                              : 'text-muted hover:bg-hover hover:text-primary'
                          }`}
                        >
                          Dashboard
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Theme Toggle - Mobile Only */}
        <div className="pt-4 flex justify-center sm:hidden">
          <div className="bg-page rounded-full p-1">
            <ThemeToggle />
          </div>
        </div>

        {/* User Menu */}
        <div className="relative pt-4 mt-4 border-t border-default" ref={userMenuRef}>
          {/* User Menu Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-default rounded-lg shadow-xl overflow-hidden hidden lg:block">
              <div className="px-4 py-3 border-b border-default">
                <div className="text-sm text-muted mb-1">Signed in as</div>
                <div className="text-sm text-primary font-medium">roy@theanomaly.xyz</div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-secondary hover:bg-hover transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}

          {/* User Button */}
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-full flex items-center justify-center lg:justify-start lg:gap-3 p-3 rounded-lg hover:bg-hover transition-colors group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A192F8] to-[#8B5CF6] flex items-center justify-center text-white font-semibold flex-shrink-0">
              RT
            </div>
            <div className="flex-1 text-left hidden lg:block">
              <div className="text-sm font-medium text-primary">Roy Tanaka</div>
              <div className="text-xs text-muted">Admin</div>
            </div>
            <ChevronUp className={`w-4 h-4 text-muted transition-transform hidden lg:block ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </aside>
  );
}