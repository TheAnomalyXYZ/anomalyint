import { ChevronDown, ChevronUp, RefreshCw, AlertCircle } from 'lucide-react';
import { useState } from 'react';

type QueueItem = {
  id: string;
  message: string;
  recipients: number;
  status: 'sending' | 'completed' | 'failed';
  progress: {
    current: number;
    total: number;
    failed?: number;
  };
  sentAt: string;
};

type FailedMessage = {
  id: string;
  recipient: string;
  reason: string;
};

const mockQueueItems: QueueItem[] = [
  {
    id: '1',
    message: 'Event Announcement',
    recipients: 5000,
    status: 'sending',
    progress: {
      current: 2341,
      total: 5000,
    },
    sentAt: 'Jan 20, 10:15 AM',
  },
  {
    id: '2',
    message: 'Welcome batch',
    recipients: 500,
    status: 'completed',
    progress: {
      current: 500,
      total: 500,
    },
    sentAt: 'Jan 19, 3:00 PM',
  },
  {
    id: '3',
    message: 'Reward notification',
    recipients: 50,
    status: 'completed',
    progress: {
      current: 48,
      total: 50,
      failed: 2,
    },
    sentAt: 'Jan 19, 11:00 AM',
  },
];

const mockFailedMessages: FailedMessage[] = [
  {
    id: '1',
    recipient: 'U-847291 (@user_123)',
    reason: 'User blocked bot',
  },
  {
    id: '2',
    recipient: 'U-283749 (@crypto_fan)',
    reason: 'Invalid chat ID',
  },
];

export function MessageQueuePanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showFailedMessages, setShowFailedMessages] = useState(false);

  const queueStats = {
    pending: 1247,
    sendingRate: 50,
    delivered: 8432,
    failed: 23,
  };

  const statusColor = queueStats.failed > 50 ? 'yellow' : 'green';

  return (
    <div className="bg-[#1E293B] border-t border-[#334155]">
      {/* Header */}
      <div
        className="px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-[#1E293B]/80 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusColor === 'green' ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'}`} />
            <span className="text-sm font-medium text-white">Message Queue</span>
          </div>
          <span className={`text-xs ${statusColor === 'green' ? 'text-[#22C55E]' : 'text-[#F59E0B]'}`}>
            {statusColor === 'green' ? 'Healthy' : 'Processing'}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Quick Stats */}
          {!isCollapsed && (
            <div className="flex items-center gap-6 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Pending:</span>
                <span className="text-white font-medium">{queueStats.pending}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Sending:</span>
                <span className="text-white font-medium">{queueStats.sendingRate}/min</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Delivered:</span>
                <span className="text-green-400 font-medium">{queueStats.delivered.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Failed:</span>
                <span className="text-red-400 font-medium">{queueStats.failed}</span>
              </div>
            </div>
          )}
          
          <button className="p-1 hover:bg-[#334155] rounded transition-colors">
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
          
          {isCollapsed ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {!isCollapsed && (
        <div className="px-6 pb-4">
          {/* Queue Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Pending</div>
              <div className="text-xl font-bold text-white">{queueStats.pending.toLocaleString()}</div>
            </div>
            <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Rate Limit</div>
              <div className="text-xl font-bold text-white">{queueStats.sendingRate}/min</div>
            </div>
            <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Delivered</div>
              <div className="text-xl font-bold text-green-400">{queueStats.delivered.toLocaleString()}</div>
            </div>
            <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Failed</div>
              <div className="text-xl font-bold text-red-400">{queueStats.failed}</div>
            </div>
          </div>

          {/* Recent Queue Items */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Recent Queue Items</h4>
            <div className="bg-[#0F172A] border border-[#334155] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#1E293B]">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-2">Message</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-2">Recipients</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-2">Status</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-2">Progress</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-2">Sent At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {mockQueueItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[#1E293B]/50">
                      <td className="px-4 py-3 text-sm text-white">{item.message}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{item.recipients.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            item.status === 'sending'
                              ? 'bg-blue-500/20 text-blue-400'
                              : item.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[150px]">
                            <div className="w-full bg-[#0F172A] rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  item.status === 'sending'
                                    ? 'bg-blue-500'
                                    : item.progress.failed
                                    ? 'bg-amber-500'
                                    : 'bg-green-500'
                                }`}
                                style={{
                                  width: `${(item.progress.current / item.progress.total) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {item.progress.current} / {item.progress.total}
                            {item.progress.failed ? ` (${item.progress.failed} failed)` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{item.sentAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Failed Messages Section */}
          {queueStats.failed > 0 && (
            <div>
              <button
                onClick={() => setShowFailedMessages(!showFailedMessages)}
                className="flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 mb-3 cursor-pointer"
              >
                <AlertCircle className="w-4 h-4" />
                {queueStats.failed} Failed Messages
                {showFailedMessages ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showFailedMessages && (
                <div className="bg-[#0F172A] border border-red-500/30 rounded-lg p-4">
                  <div className="space-y-3 mb-4">
                    {mockFailedMessages.map((failed) => (
                      <div
                        key={failed.id}
                        className="flex items-start justify-between pb-3 border-b border-[#334155] last:border-0"
                      >
                        <div>
                          <div className="text-sm text-white mb-1">{failed.recipient}</div>
                          <div className="text-xs text-red-400">{failed.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="px-4 py-2 bg-red-600/20 border border-red-600/30 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                    Retry Failed Messages
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
