import { useState } from 'react';
import { PurchasesPage } from '@/app/components/PurchasesPage';
import { NFTMintsPage } from '@/app/components/NFTMintsPage';
import { TransfersPage } from '@/app/components/TransfersPage';

type TransactionTab = 'purchases' | 'nftmints' | 'transfers';

export function TransactionsPage() {
  const [activeTab, setActiveTab] = useState<TransactionTab>('purchases');

  const tabs = [
    { id: 'purchases' as TransactionTab, label: 'Purchases' },
    { id: 'nftmints' as TransactionTab, label: 'NFT Mints' },
    { id: 'transfers' as TransactionTab, label: 'Transfers' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'purchases':
        return <PurchasesPage />;
      case 'nftmints':
        return <NFTMintsPage />;
      case 'transfers':
        return <TransfersPage />;
      default:
        return <PurchasesPage />;
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Tab Navigation */}
      <div className="border-b border-[#334155] bg-[#1E293B]">
        <div className="px-8">
          <div className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-[#A192F8] text-white font-medium'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}