export default function BangCoinsPage() {
  const packages = [
    { coins: 10,  price: '$10'  },
    { coins: 30,  price: '$30'  },
    { coins: 50,  price: '$50'  },
    { coins: 100, price: '$100' },
    { coins: 200, price: '$200' },
  ]

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-white font-bold text-xl mb-1">BangCoins</h1>
      <p className="text-brand-muted text-sm mb-6">Used to unlock content, tip creators, send messages, and make calls.</p>

      {/* Wallet balance */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-5 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-2xl">🪙</div>
        <div>
          <p className="text-brand-muted text-sm">Current Balance</p>
          <p className="text-white text-3xl font-black">3,500 <span className="text-brand-muted text-base font-normal">BangCoins</span></p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['Reload BangCoins', 'Cash Out', 'Transactions'].map((tab, i) => (
          <button key={tab} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${i === 0 ? 'bg-brand-red text-white' : 'bg-brand-surface border border-brand-border text-brand-text hover:bg-brand-card'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Packages */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {packages.map(pkg => (
          <div key={pkg.coins} className="bg-brand-surface border-2 border-brand-border hover:border-brand-red rounded-xl p-4 text-center cursor-pointer transition">
            <p className="text-white font-black text-2xl">{pkg.coins}</p>
            <p className="text-brand-muted text-sm">BangCoins</p>
            <p className="text-brand-red font-bold mt-1">{pkg.price}</p>
          </div>
        ))}
        <div className="bg-brand-surface border-2 border-dashed border-brand-border hover:border-brand-red rounded-xl p-4 text-center cursor-pointer transition">
          <p className="text-brand-muted text-sm">Other Amount</p>
        </div>
      </div>

      {/* Payment methods */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-5">
        <h3 className="text-white font-bold mb-4">Select Payment Method</h3>
        <div className="grid grid-cols-2 gap-3">
          {['Google Pay','Apple Pay','PayPal','Credit/Debit Card','Bank Transfer'].map(method => (
            <button key={method} className="bg-brand-card border border-brand-border rounded-lg px-4 py-3 text-brand-text text-sm hover:border-brand-red transition text-left">
              {method}
            </button>
          ))}
        </div>
        <button className="w-full mt-4 bg-brand-red text-white font-bold py-3 rounded-lg hover:bg-red-600 transition">
          Complete Purchase
        </button>
      </div>
    </div>
  )
}
