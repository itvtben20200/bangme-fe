'use client'
import { useQuery }  from '@tanstack/react-query'
import { Compass, Search } from 'lucide-react'
import { useState }  from 'react'
import { useSearchParams } from 'next/navigation'
import api           from '@/lib/api'
import { mediaUrl }  from '@/lib/utils'
import type { User } from '@/types'

const CATEGORIES = [
  { label: 'All',       emoji: '🌐' },
  { label: 'Asian',     emoji: '🌸' },
  { label: 'Western',   emoji: '⭐' },
  { label: 'Latina',    emoji: '🔥' },
  { label: 'Ebony',     emoji: '💫' },
  { label: 'Fitness',   emoji: '💪' },
  { label: 'Cosplay',   emoji: '🎭' },
  { label: 'Couples',   emoji: '💑' },
  { label: 'Live Only', emoji: '🔴' },
  { label: 'New Faces', emoji: '✨' },
]

export default function ExplorePage() {
  const searchParams  = useSearchParams()
  const [query, setQuery]     = useState('')
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get('category')
      ? CATEGORIES.find(c => c.label.toLowerCase() === searchParams.get('category'))?.label ?? 'All'
      : 'All'
  )

  const { data, isLoading } = useQuery<{ success: boolean; data: User[] }>({
    queryKey: ['creators', query, activeCategory],
    queryFn:  () => {
      const params = new URLSearchParams()
      if (query) params.set('search', query)
      if (activeCategory !== 'All') params.set('category', activeCategory.toLowerCase())
      return api.get(`/creators?${params.toString()}`).then((r) => r.data)
    },
  })

  const creators = data?.data ?? []


  return (
    <div className="min-h-screen bg-[#121212] px-4 py-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Compass size={28} className="text-[#ff4757]" />
        <h1 className="text-3xl font-bold text-white">Explore Creators</h1>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search creators…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[#161616] text-white pl-11 pr-4 py-3 rounded-xl border border-[#222] focus:border-[#ff4757] focus:outline-none transition"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 flex-wrap mb-8">
        {CATEGORIES.map(cat => (
          <button
            key={cat.label}
            onClick={() => setActiveCategory(cat.label)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition whitespace-nowrap ${
              activeCategory === cat.label
                ? 'bg-[#ff4757] border-[#ff4757] text-white'
                : 'bg-[#161616] border-[#222] text-gray-400 hover:border-[#ff4757]/50 hover:text-white'
            }`}
          >
            <span>{cat.emoji}</span> {cat.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-gray-500 text-center py-20">Loading…</p>
      ) : creators.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Compass size={48} className="mx-auto mb-4 opacity-30" />
          <p>No creators found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {creators.map((creator) => (
            <a
              key={creator.id}
              href={`/creator/${creator.username}`}
              className="bg-[#161616] rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform border border-[#222] hover:border-[#ff4757]/40"
            >
              <div className="h-24 bg-gradient-to-r from-[#ff4757]/30 to-[#ff6b6b]/10" />
              <div className="px-4 pb-4 -mt-8">
                {creator.avatarKey ? (
                  <img
                    src={mediaUrl(creator.avatarKey)!}
                    alt={creator.username}
                    className="w-16 h-16 rounded-full object-cover border-4 border-[#161616]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#ff4757]/20 border-4 border-[#161616] flex items-center justify-center">
                    <span className="text-xl font-bold text-[#ff4757]">
                      {creator.username[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <p className="mt-2 font-semibold text-white truncate">
                  {creator.displayName ?? creator.username}
                </p>
                <p className="text-xs text-gray-400 truncate">@{creator.username}</p>
                {creator.bio && (
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">{creator.bio}</p>
                )}
                <button className="mt-3 w-full bg-[#ff4757] hover:bg-red-500 text-white text-sm font-semibold py-1.5 rounded-lg transition">
                  Subscribe
                </button>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
