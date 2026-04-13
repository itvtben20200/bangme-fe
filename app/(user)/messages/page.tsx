export default function MessagesPage() {
  return (
    <div className="flex h-screen bg-brand-dark">
      {/* Conversations list */}
      <div className="w-80 border-r border-brand-border flex flex-col">
        <div className="p-4 border-b border-brand-border flex items-center justify-between">
          <h1 className="text-white font-bold text-lg">Messages</h1>
          <button className="text-brand-muted hover:text-white" title="Mass message">📢</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {['@NovaRush','@LunaVibe','@StellarDreams','@CosmicFlow','@VibeMaster'].map((name, i) => (
            <div key={name} className="flex items-center gap-3 p-3 hover:bg-brand-surface cursor-pointer border-b border-brand-border">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-brand-card" />
                {i % 2 === 0 && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-brand-dark" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-white text-sm font-semibold">{name}</p>
                  {i < 3 && <span className="bg-brand-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{i + 1}</span>}
                </div>
                <p className="text-brand-muted text-xs truncate">Last message preview...</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-card" />
            <div>
              <p className="text-white font-semibold text-sm">@NovaRush</p>
              <p className="text-green-400 text-xs">Online</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 text-sm text-brand-text hover:bg-brand-card" title="Audio Call – 8 BangCoins/min">🎧 Audio</button>
            <button className="bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 text-sm text-brand-text hover:bg-brand-card" title="Video Call – 15 BangCoins/min">📹 Video</button>
          </div>
        </div>

        <div className="bg-brand-surface border-b border-brand-border px-4 py-2 text-xs text-brand-muted flex gap-6">
          <span>💬 Messages: <strong className="text-white">2 coins each</strong></span>
          <span>🎧 Audio: <strong className="text-white">8 coins/min</strong></span>
          <span>📹 Video: <strong className="text-white">15 coins/min</strong></span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <p className="text-center text-brand-muted text-xs">Messages will appear here</p>
        </div>

        <div className="p-4 border-t border-brand-border flex items-center gap-3">
          <input
            type="text"
            placeholder="Type a message (2 BangCoins)…"
            className="flex-1 bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
          />
          <button className="bg-brand-red text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600 transition">
            Send (2 🪙)
          </button>
        </div>
      </div>
    </div>
  )
}
