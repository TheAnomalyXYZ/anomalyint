export function WalletsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Wallets</h1>
        <p className="text-secondary">Manage user wallets and wallet connections</p>
      </div>

      <div className="bg-card backdrop-blur-sm rounded-2xl p-8 border border-default">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-[#A192F8]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#A192F8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-primary mb-2">Wallets Page</h3>
          <p className="text-secondary">Wallet management functionality coming soon</p>
        </div>
      </div>
    </div>
  );
}
