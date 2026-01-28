// Plume Events Page - reusing Somnia template structure
import { useState } from 'react';
import { Filter } from 'lucide-react';

type EventType = 'all' | 'transfer' | 'mint' | 'burn' | 'approval';

const mockEvents = [
  { id: '1', type: 'transfer', from: '0x1234...5678', to: '0xabcd...efgh', amount: '100 PLUME', timestamp: '2 mins ago', txHash: '0x9876...5432' },
  { id: '2', type: 'mint', from: 'Contract', to: '0x9999...1111', amount: '50 PLUME', timestamp: '5 mins ago', txHash: '0x1111...2222' },
  { id: '3', type: 'burn', from: '0x3333...4444', to: 'Burn Address', amount: '25 PLUME', timestamp: '10 mins ago', txHash: '0x5555...6666' },
  { id: '4', type: 'approval', from: '0x7777...8888', to: '0x9999...aaaa', amount: '1000 PLUME', timestamp: '15 mins ago', txHash: '0xbbbb...cccc' },
];

export function PlumeEventsPage() {
  const [selectedFilter, setSelectedFilter] = useState<EventType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getEventColor = (type: string) => {
    switch (type) {
      case 'transfer':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'mint':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'burn':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'approval':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Plume Events</h1>
        <p className="text-secondary">Real-time on-chain transaction monitoring</p>
      </div>

      {/* Filters */}
      <div className="bg-card backdrop-blur-sm rounded-2xl p-6 border border-default mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-secondary" />
            <span className="text-sm font-medium text-primary">Filter:</span>
          </div>
          
          {['all', 'transfer', 'mint', 'burn', 'approval'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter as EventType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === filter
                  ? 'bg-[#A192F8] text-white'
                  : 'bg-hover text-secondary hover:text-primary'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="bg-card backdrop-blur-sm rounded-2xl border border-default overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-hover/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-secondary uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-secondary uppercase tracking-wider">From</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-secondary uppercase tracking-wider">To</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-secondary uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-secondary uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-secondary uppercase tracking-wider">Tx Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {mockEvents.map((event) => (
                <tr key={event.id} className="hover:bg-hover/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getEventColor(event.type)}`}>
                      {event.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm text-primary">{event.from}</code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm text-primary">{event.to}</code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-primary">{event.amount}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-secondary">{event.timestamp}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm text-[#A192F8]">{event.txHash}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
