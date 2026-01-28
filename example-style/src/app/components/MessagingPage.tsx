import { useState } from 'react';
import {
  Plus,
  X,
  ChevronDown,
  Calendar,
  Send,
  Clock,
  Eye,
  Smile,
  Bold,
  Italic,
  Code,
  Image as ImageIcon,
  Link as LinkIcon,
  AlertCircle,
} from 'lucide-react';
import { TemplateManagerModal } from '@/app/components/TemplateManagerModal';
import { MessageQueuePanel } from '@/app/components/MessageQueuePanel';

type User = {
  id: string;
  telegramUsername: string | null;
  userId: string;
  games: string[];
  hasTelegram: boolean;
};

type Filter = {
  id: string;
  type: 'game' | 'loginMethod' | 'kyc' | 'wallet' | 'dateRange' | 'credits';
  label: string;
  value: string;
};

// Mock data
const mockPreSelectedUsers: User[] = [
  {
    id: '1',
    telegramUsername: '@gamer_pro',
    userId: 'U-847291',
    games: ['Dont Die', 'GMeow'],
    hasTelegram: true,
  },
  {
    id: '2',
    telegramUsername: '@nft_collector',
    userId: 'U-283749',
    games: ['Goonville'],
    hasTelegram: true,
  },
];

const mockMatchingUsers: User[] = [
  {
    id: '3',
    telegramUsername: '@crypto_knight',
    userId: 'U-192837',
    games: ['Neura Knights'],
    hasTelegram: true,
  },
  {
    id: '4',
    telegramUsername: '@web3_player',
    userId: 'U-564738',
    games: ['Vectra', 'Synapse'],
    hasTelegram: true,
  },
  {
    id: '5',
    telegramUsername: null,
    userId: 'U-837461',
    games: ['MooFO'],
    hasTelegram: false,
  },
];

const gameColors: Record<string, string> = {
  'Dont Die': 'bg-red-500/20 text-red-400 border-red-500/30',
  GMeow: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Goonville: 'bg-green-500/20 text-green-400 border-green-500/30',
  MooFO: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Vectra: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Neura Knights': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  Synapse: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

export function MessagingPage() {
  const [preSelectedUsers, setPreSelectedUsers] = useState<User[]>(mockPreSelectedUsers);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [selectedSegment, setSelectedSegment] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [scheduleOption, setScheduleOption] = useState<'immediate' | 'scheduled' | 'queue'>(
    'immediate'
  );
  const [scheduledDate, setScheduledDate] = useState('');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Template content mapping
  const templateContent: Record<string, string> = {
    welcome: 'Hey {username}! 👋\n\nWelcome to {game}. You\'re all set to start playing.\n\nNeed help? Check out our guide or ask in the community.',
    event: '🎮 New Event Alert!\n\n{event_name} is now live in {game}.\n\nDon\'t miss out — ends {event_end_date}.',
    reward: '🎁 You\'ve earned a reward!\n\n{reward_amount} credits have been added to your account.\n\nKeep playing to earn more!',
  };

  // Calculate counts
  const usersWithoutTelegram = preSelectedUsers.filter((u) => !u.hasTelegram).length;
  const totalRecipients = preSelectedUsers.filter((u) => u.hasTelegram).length;

  const removePreSelectedUser = (id: string) => {
    setPreSelectedUsers(preSelectedUsers.filter((u) => u.id !== id));
  };

  const clearAllPreSelected = () => {
    setPreSelectedUsers([]);
  };

  const addFilter = () => {
    const newFilter: Filter = {
      id: Date.now().toString(),
      type: 'game',
      label: 'Game',
      value: '',
    };
    setFilters([...filters, newFilter]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id));
  };

  const insertVariable = (variable: string) => {
    setMessageContent(messageContent + variable);
  };

  const handleTemplateSelect = (template: { name: string; content: string }) => {
    setMessageContent(template.content);
    setSelectedTemplate(template.name);
  };

  // Mock preview message with variables replaced
  const getPreviewMessage = () => {
    return messageContent
      .replace(/{username}/g, 'gamer_pro')
      .replace(/{game}/g, 'Dont Die')
      .replace(/{credits_balance}/g, '1,250');
  };

  return (
    <div className="flex flex-col h-full bg-[#0F172A]">
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Recipients */}
        <div className="w-2/5 border-r border-[#334155] overflow-y-auto">
          <div className="p-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-white">Recipients</h2>
                <div className="px-3 py-1 bg-[#3B82F6]/20 border border-[#3B82F6]/30 rounded-full">
                  <span className="text-sm font-medium text-[#3B82F6]">
                    {totalRecipients} users selected
                  </span>
                </div>
              </div>
            </div>

            {/* Pre-selected Users */}
            {preSelectedUsers.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-300">Pre-selected Users</h3>
                  <button
                    onClick={clearAllPreSelected}
                    className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>

                <div className="bg-[#1E293B] border border-[#334155] rounded-lg divide-y divide-[#334155]">
                  {preSelectedUsers.map((user) => (
                    <div key={user.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white">
                            {user.telegramUsername || user.userId}
                          </span>
                          {!user.hasTelegram && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                              No TG
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {user.games.map((game) => (
                            <span
                              key={game}
                              className={`text-xs px-2 py-0.5 rounded border ${
                                gameColors[game] || 'bg-gray-500/20 text-gray-400'
                              }`}
                            >
                              {game}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => removePreSelectedUser(user.id)}
                        className="p-1 hover:bg-[#334155] rounded transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning Banner */}
            {usersWithoutTelegram > 0 && (
              <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-400 font-medium">
                    {usersWithoutTelegram} selected user{usersWithoutTelegram > 1 ? 's' : ''}{' '}
                    don't have Telegram connected
                  </p>
                  <p className="text-xs text-amber-400/80 mt-1">
                    They will be skipped when sending
                  </p>
                </div>
              </div>
            )}

            {/* Build Recipient List */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">
                Or: Build Recipient List
              </h3>

              {/* Saved Segments */}
              <div className="mb-4">
                <div className="relative">
                  <select
                    value={selectedSegment}
                    onChange={(e) => setSelectedSegment(e.target.value)}
                    className="w-full appearance-none bg-[#1E293B] border border-[#334155] rounded-lg px-4 py-2.5 pr-10 text-sm text-gray-300 focus:outline-none focus:border-[#3B82F6] cursor-pointer"
                  >
                    <option value="">Load saved segment</option>
                    <option value="all-telegram">All Telegram users</option>
                    <option value="dont-die">Dont Die players</option>
                    <option value="high-spenders">High spenders</option>
                    <option value="new-users">New users (7 days)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-3 mb-4">
                {filters.map((filter) => (
                  <div
                    key={filter.id}
                    className="bg-[#1E293B] border border-[#334155] rounded-lg p-3 flex items-center gap-2"
                  >
                    <select className="flex-1 bg-[#0F172A] border border-[#334155] rounded px-2 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-[#3B82F6] cursor-pointer">
                      <option>Game</option>
                      <option>Login Method</option>
                      <option>KYC Level</option>
                      <option>Has Privy Wallet</option>
                      <option>Date Range</option>
                      <option>Credits Balance</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Value"
                      className="flex-1 bg-[#0F172A] border border-[#334155] rounded px-2 py-1.5 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]"
                    />
                    <button
                      onClick={() => removeFilter(filter.id)}
                      className="p-1 hover:bg-[#334155] rounded transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addFilter}
                className="flex items-center gap-2 px-3 py-2 bg-[#1E293B] border border-[#334155] hover:bg-[#334155] text-gray-300 rounded-lg text-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Filter
              </button>

              {filters.length > 0 && (
                <div className="mt-4 text-sm text-gray-400">
                  <span className="text-[#3B82F6] font-medium">1,247 users</span> match current
                  filters
                </div>
              )}
            </div>

            {/* Recipient Preview */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Recipient Preview</h3>
              <div className="bg-[#1E293B] border border-[#334155] rounded-lg divide-y divide-[#334155] max-h-[300px] overflow-y-auto">
                {mockMatchingUsers.slice(0, 10).map((user) => (
                  <div key={user.id} className="px-4 py-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-white">
                          {user.telegramUsername || user.userId}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {user.games.slice(0, 2).map((game) => (
                            <span
                              key={game}
                              className={`text-xs px-1.5 py-0.5 rounded border ${
                                gameColors[game] || 'bg-gray-500/20 text-gray-400'
                              }`}
                            >
                              {game}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full text-center py-2 text-sm text-[#3B82F6] hover:text-[#3B82F6]/80 cursor-pointer">
                View all {mockMatchingUsers.length} recipients
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Compose */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">Compose Message</h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0088cc">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                  </svg>
                  <span className="text-sm text-blue-400 font-medium">Telegram</span>
                </div>
              </div>
            </div>

            {/* Template Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Template (Optional)
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <select
                    value={selectedTemplate}
                    onChange={(e) => {
                      const template = e.target.value;
                      setSelectedTemplate(template);
                      if (template && templateContent[template]) {
                        setMessageContent(templateContent[template]);
                      } else if (!template) {
                        setMessageContent('');
                      }
                    }}
                    className="w-full appearance-none bg-[#1E293B] border border-[#334155] rounded-lg px-4 py-2.5 pr-10 text-sm text-gray-300 focus:outline-none focus:border-[#3B82F6] cursor-pointer"
                  >
                    <option value="">Start from scratch</option>
                    <option value="welcome">Welcome message</option>
                    <option value="event">Event announcement</option>
                    <option value="reward">Reward notification</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <button
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="px-4 py-2.5 bg-[#1E293B] border border-[#334155] hover:bg-[#334155] text-gray-300 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Manage Templates
                </button>
              </div>
            </div>

            {/* Message Composer */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">Message *</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      showPreview
                        ? 'bg-[#3B82F6] text-white'
                        : 'bg-[#1E293B] border border-[#334155] text-gray-300 hover:bg-[#334155]'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </button>
                </div>
              </div>

              {/* Formatting Toolbar */}
              <div className="bg-[#1E293B] border border-[#334155] rounded-t-lg px-3 py-2 flex items-center gap-2 border-b-0">
                <button
                  onClick={() => insertVariable('**')}
                  className="p-1.5 hover:bg-[#334155] rounded transition-colors cursor-pointer"
                  title="Bold"
                >
                  <Bold className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => insertVariable('*')}
                  className="p-1.5 hover:bg-[#334155] rounded transition-colors cursor-pointer"
                  title="Italic"
                >
                  <Italic className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => insertVariable('`')}
                  className="p-1.5 hover:bg-[#334155] rounded transition-colors cursor-pointer"
                  title="Code"
                >
                  <Code className="w-4 h-4 text-gray-400" />
                </button>
                <div className="w-px h-5 bg-[#334155]" />
                <button
                  className="p-1.5 hover:bg-[#334155] rounded transition-colors cursor-pointer"
                  title="Emoji"
                >
                  <Smile className="w-4 h-4 text-gray-400" />
                </button>
                <div className="w-px h-5 bg-[#334155]" />
                <div className="relative">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        insertVariable(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="appearance-none bg-[#0F172A] border border-[#334155] rounded px-3 py-1 pr-8 text-xs text-gray-300 hover:bg-[#334155] transition-colors cursor-pointer focus:outline-none"
                  >
                    <option value="">Insert variable</option>
                    <option value="{username}">{'{username}'}</option>
                    <option value="{game}">{'{game}'}</option>
                    <option value="{credits_balance}">{'{credits_balance}'}</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {!showPreview ? (
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Write your message here... Use **bold**, *italic*, `code` for formatting"
                  rows={10}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-b-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6] resize-none font-mono text-sm"
                />
              ) : (
                <div className="bg-[#1E293B] border border-[#334155] rounded-b-lg p-4 min-h-[200px]">
                  <div className="bg-[#0088cc] text-white rounded-lg p-3 max-w-md">
                    <div className="text-sm whitespace-pre-wrap">{getPreviewMessage()}</div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Preview shown with sample data
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  Supports Telegram markdown formatting
                </p>
                <p className="text-xs text-gray-500">
                  {messageContent.length} / 4096 characters
                </p>
              </div>
            </div>

            {/* Attachments */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Attachments (Optional)
              </label>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] border border-[#334155] hover:bg-[#334155] text-gray-300 rounded-lg text-sm transition-colors cursor-pointer">
                  <ImageIcon className="w-4 h-4" />
                  Add Image
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] border border-[#334155] hover:bg-[#334155] text-gray-300 rounded-lg text-sm transition-colors cursor-pointer">
                  <LinkIcon className="w-4 h-4" />
                  Add Button
                </button>
              </div>
            </div>

            {/* Schedule Options */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Schedule
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="immediate"
                    checked={scheduleOption === 'immediate'}
                    onChange={(e) =>
                      setScheduleOption(e.target.value as 'immediate' | 'scheduled' | 'queue')
                    }
                    className="w-4 h-4 text-[#3B82F6]"
                  />
                  <span className="text-white">Send immediately</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="scheduled"
                    checked={scheduleOption === 'scheduled'}
                    onChange={(e) =>
                      setScheduleOption(e.target.value as 'immediate' | 'scheduled' | 'queue')
                    }
                    className="w-4 h-4 text-[#3B82F6]"
                  />
                  <span className="text-white">Schedule for later</span>
                </label>
                {scheduleOption === 'scheduled' && (
                  <div className="ml-6 mt-2">
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="queue"
                    checked={scheduleOption === 'queue'}
                    onChange={(e) =>
                      setScheduleOption(e.target.value as 'immediate' | 'scheduled' | 'queue')
                    }
                    className="w-4 h-4 text-[#3B82F6]"
                  />
                  <span className="text-white">Add to queue (optimal hours)</span>
                </label>
              </div>
            </div>

            {/* Send Section */}
            <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-white font-medium">Ready to send</div>
                  <div className="text-sm text-gray-400 mt-1">
                    Send to {totalRecipients} users via Telegram
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  disabled={!messageContent || totalRecipients === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#3B82F6] hover:bg-[#3B82F6]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {scheduleOption === 'immediate' ? 'Send Now' : 'Schedule'}
                </button>
                <button className="px-6 py-3 bg-[#0F172A] border border-[#334155] hover:bg-[#334155] text-white rounded-lg font-medium transition-colors cursor-pointer">
                  Save as Draft
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Template Manager Modal */}
        <TemplateManagerModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          onSelectTemplate={handleTemplateSelect}
        />
      </div>

      {/* Message Queue Panel */}
      <MessageQueuePanel />
    </div>
  );
}