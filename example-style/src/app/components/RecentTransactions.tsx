import { ArrowRight } from 'lucide-react';

interface Transaction {
  timestamp: string;
  type: string;
  amount: string;
  from: {
    address: string;
    type: 'custodial' | 'external' | 'privy';
  };
  to: {
    address: string;
    type: 'custodial' | 'external' | 'privy';
  };
}

const transactions: Transaction[] = [
  {
    timestamp: '2 min ago',
    type: 'Deposit',
    amount: '0.5 ETH',
    from: { address: '0x742d...3a9c', type: 'external' },
    to: { address: '0x9f2a...7b1e', type: 'custodial' },
  },
  {
    timestamp: '5 min ago',
    type: 'Withdrawal',
    amount: '120 USDC',
    from: { address: '0x3c1b...4f2d', type: 'privy' },
    to: { address: '0x8a4c...2e9f', type: 'external' },
  },
  {
    timestamp: '12 min ago',
    type: 'Transfer',
    amount: '0.25 ETH',
    from: { address: '0x5d8e...6c3a', type: 'custodial' },
    to: { address: '0x1f9b...8d2c', type: 'custodial' },
  },
  {
    timestamp: '18 min ago',
    type: 'Deposit',
    amount: '500 USDC',
    from: { address: '0x6e2f...9a4b', type: 'external' },
    to: { address: '0x4b7c...5e1d', type: 'privy' },
  },
  {
    timestamp: '23 min ago',
    type: 'Withdrawal',
    amount: '1.2 ETH',
    from: { address: '0x2a8d...7f3e', type: 'custodial' },
    to: { address: '0x9c5f...1b8a', type: 'external' },
  },
];

const getWalletTypeColor = (type: string) => {
  switch (type) {
    case 'custodial':
      return 'bg-[#A192F8]/10 text-[#A192F8] border-[#A192F8]/20';
    case 'privy':
      return 'bg-[#A192F8]/10 text-[#A192F8] border-[#A192F8]/20';
    case 'external':
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
};

export function RecentTransactions() {
  return (
    <div className="bg-card rounded-3xl p-6 border border-default shadow-card">
      <h2 className="text-xl font-semibold text-primary mb-4">Recent Transactions</h2>
      
      <div className="overflow-x-auto -mx-6 px-6">
        <div className="min-w-[600px] space-y-4">
          {transactions.map((tx, index) => (
            <div key={index} className="border-b border-default pb-4 last:border-0 last:pb-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-medium text-primary mb-1">{tx.type}</div>
                  <div className="text-xs text-muted">{tx.timestamp}</div>
                </div>
                <div className="text-sm font-semibold text-primary">{tx.amount}</div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <code className="text-xs text-secondary bg-page px-2 py-1 rounded">
                    {tx.from.address}
                  </code>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getWalletTypeColor(tx.from.type)}`}>
                    {tx.from.type}
                  </span>
                </div>
                
                <ArrowRight className="w-4 h-4 text-muted flex-shrink-0" />
                
                <div className="flex items-center gap-2">
                  <code className="text-xs text-secondary bg-page px-2 py-1 rounded">
                    {tx.to.address}
                  </code>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getWalletTypeColor(tx.to.type)}`}>
                    {tx.to.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}