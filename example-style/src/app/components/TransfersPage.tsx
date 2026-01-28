import { ArrowRightLeft, Clock } from 'lucide-react';

export function TransfersPage() {
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Transfers</h1>
        <p className="text-gray-400">Token withdrawals and payouts</p>
      </div>

      {/* Coming Soon Placeholder */}
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md space-y-4">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-[#1E293B] border border-[#334155] flex items-center justify-center">
              <ArrowRightLeft className="w-10 h-10 text-gray-500" />
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-gray-300">Coming Soon</h2>
        </div>
      </div>
    </div>
  );
}