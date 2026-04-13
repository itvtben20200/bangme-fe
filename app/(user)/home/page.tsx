export default function HomePage() {
  return (
    <div className="flex gap-6 p-6">
      {/* Feed */}
      <section className="flex-1">
        <h1 className="text-white font-bold text-xl mb-4">Home</h1>
        {/* StoriesRow */}
        <div className="h-24 bg-brand-surface border border-brand-border rounded-xl mb-4 flex items-center px-4 text-brand-muted text-sm">
          Stories row — component placeholder
        </div>
        {/* Feed posts */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-brand-surface border border-brand-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-brand-card" />
                <div>
                  <p className="text-white font-semibold text-sm">@CreatorName</p>
                  <p className="text-brand-muted text-xs">{i + 1}h ago</p>
                </div>
              </div>
              <div className="h-48 bg-brand-card rounded-lg mb-3" />
              <p className="text-brand-text text-sm mb-2">"Post caption goes here"</p>
              <div className="flex gap-4">
                <button className="text-brand-muted text-sm hover:text-brand-red transition">♥ Like</button>
                <button className="text-brand-muted text-sm hover:text-white transition">💬 Comment</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Right sidebar */}
      <aside className="w-72 hidden lg:block">
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 mb-4">
          <h3 className="text-white font-bold mb-3">Suggested Creators</h3>
          {['@MiraLuxe','@NovaRush','@JadeMuse'].map(name => (
            <div key={name} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-card" />
                <span className="text-brand-text text-sm">{name}</span>
              </div>
              <button className="text-xs text-brand-red font-bold">Follow</button>
            </div>
          ))}
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
          <p className="text-brand-muted text-xs mb-1">BangCoins Balance</p>
          <p className="text-white text-2xl font-black mb-3">3,500</p>
          <button className="w-full bg-brand-red text-white font-bold py-2 rounded-lg text-sm hover:bg-red-600 transition">
            Recharge
          </button>
        </div>
      </aside>
    </div>
  )
}
