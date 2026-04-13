export default function CreatorCenterPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white font-bold text-xl">Creator Center</h1>
        <div className="flex gap-2">
          <button className="bg-brand-surface border border-brand-border text-brand-text px-4 py-2 rounded-lg text-sm font-bold">Mass Message</button>
          <button className="bg-brand-red text-white px-4 py-2 rounded-lg text-sm font-bold">Go Live</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Earnings (Month)', value: '$1,842', trend: '▲ 12%', up: true },
          { label: 'Subscribers', value: '1,254',    trend: '▲ 4%',  up: true },
          { label: 'Followers',   value: '9,816',    trend: '▲ 2%',  up: true },
          { label: 'Messages (7d)', value: '482',    trend: '▼ 3%',  up: false },
        ].map(kpi => (
          <div key={kpi.label} className="bg-brand-surface border border-brand-border rounded-xl p-4">
            <p className="text-brand-muted text-xs mb-1">{kpi.label}</p>
            <p className="text-white font-black text-2xl">{kpi.value}</p>
            <p className={`text-xs font-bold ${kpi.up ? 'text-green-400' : 'text-red-400'}`}>{kpi.trend}</p>
          </div>
        ))}
      </div>

      {/* Earnings summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-2 bg-brand-surface border border-brand-border rounded-xl p-5">
          <h3 className="text-white font-bold mb-4">Earnings Breakdown</h3>
          <div className="grid grid-cols-2 gap-3">
            {[['Tips','$426'],['Content Sales','$1,098'],['Subscriptions','$278'],['Other','$40']].map(([label, val]) => (
              <div key={label} className="bg-brand-card border border-brand-border rounded-lg p-3">
                <p className="text-brand-muted text-xs">{label}</p>
                <p className="text-white font-black text-xl">{val}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5">
          <h3 className="text-white font-bold mb-3">Quick Actions</h3>
          <div className="space-y-2">
            {['Upload Content','Edit Profile','Creator Pricing','Promos','Billing & Payouts'].map(action => (
              <button key={action} className="w-full bg-brand-card border border-brand-border text-brand-text text-sm py-2 rounded-lg hover:border-brand-red transition text-left px-3">
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Financial table */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-5">
        <h3 className="text-white font-bold mb-4">Financial Center</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border">
              {['Date','Type','Gross','Platform Tax (25%)','Net','Note'].map(h => (
                <th key={h} className="text-brand-muted text-left pb-2 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['2025-09-01','Subscription','$20.00','$5.00','$15.00','Monthly sub – @NovaRush'],
              ['2025-09-02','Tip','$10.00','$2.50','$7.50','Tip – @LunaVelvet'],
              ['2025-09-03','Sale','$15.00','$3.75','$11.25','Premium photo'],
            ].map((row, i) => (
              <tr key={i} className="border-b border-brand-border">
                {row.map((cell, j) => (
                  <td key={j} className="py-3 text-brand-text">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
