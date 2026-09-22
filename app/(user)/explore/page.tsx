'use client'
import { useQuery }        from '@tanstack/react-query'
import { Compass, Image as ImageIcon, MapPin, Search, SlidersHorizontal, UserRound, Wifi } from 'lucide-react'
import { useState, useMemo } from 'react'
import api       from '@/lib/api'
import { mediaUrl } from '@/lib/utils'
import type { User } from '@/types'

// --- Types --------------------------------------------------------------------

type Tab = 'explore' | 'live' | 'nearby' | 'profiles' | 'images'

type Creator = User & {
  creatorProfile?: { monthlySubPrice: number | null; isLive: boolean } | null
}

type ImageTile = {
  id: string
  creator: Creator
  src: string
  label: string
  featured: boolean
}

// --- Constants ----------------------------------------------------------------

const GENDERS = [
  { label: 'All',        value: '' },
  { label: 'Female',     value: 'female' },
  { label: 'Male',       value: 'male' },
  { label: 'Non-binary', value: 'non-binary' },
]

const AGE_MIN = 18
const AGE_MAX = 65

// --- Helpers ------------------------------------------------------------------

function calcAge(dob: string | null | undefined): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) age--
  return age > 0 ? age : null
}

function shuffleScore(seed: string): number {
  return [...seed].reduce((score, char) => score * 31 + char.charCodeAt(0), 7)
}

/** Deterministic simulated distance based on creator ID */
function stableKm(id: string): string {
  const hash = [...id].reduce((a, c) => a * 31 + c.charCodeAt(0), 0)
  return ((Math.abs(hash) % 195 + 5) / 10).toFixed(1)
}

// --- Creator Card -------------------------------------------------------------

function CreatorCard({ creator, tab }: { creator: Creator; tab: Tab }) {
  const age    = calcAge(creator.dateOfBirth)
  const km     = stableKm(creator.id)
  const isLive = creator.creatorProfile?.isLive

  const bgSrc = creator.bannerKey ? mediaUrl(creator.bannerKey) : null

  return (
    <a
      href={`/creator/${creator.username}`}
      className="relative block rounded-2xl overflow-hidden border border-[#222] hover:border-[#ff0618]/50 bg-[#161616] transition-all hover:scale-[1.02]"
      style={{ aspectRatio: '2 / 3' }}
    >
      {/* Full-height background image */}
      {bgSrc ? (
        <img
          src={bgSrc}
          alt={creator.username}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff0618]/30 to-[#1a1a1a] flex items-center justify-center">
          <span className="text-6xl font-bold text-[#ff0618]/40">
            {creator.username[0]?.toUpperCase()}
          </span>
        </div>
      )}

      {/* Bottom gradient fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* LIVE badge */}
      {isLive && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#ff0618] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Live
        </div>
      )}

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2.5">
        {/* Avatar + name row */}
        <div className="flex items-center gap-2.5">
          {creator.avatarKey ? (
            <img
              src={mediaUrl(creator.avatarKey)!}
              alt=""
              className="w-10 h-10 rounded-full object-cover border-2 border-white/30 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#ff0618]/40 border-2 border-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-white">{creator.username[0]?.toUpperCase()}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">
              @{creator.username}
            </p>
            {tab === 'nearby' ? (
              <p className="text-white/60 text-xs">
                {age != null ? `${age} - ` : ''}{km} km away
              </p>
            ) : creator.bio ? (
              <p className="text-white/60 text-xs line-clamp-1">{creator.bio}</p>
            ) : null}
          </div>
        </div>

        <button
          onClick={e => e.preventDefault()}
          className="w-full bg-[#ff0618]/90 hover:bg-[#ff0618] text-white text-xs font-bold py-2 rounded-xl transition"
        >
          Subscribe
        </button>
      </div>
    </a>
  )
}

function RandomImageTile({ tile }: { tile: ImageTile }) {
  return (
    <a
      href={`/creator/${tile.creator.username}`}
      className={`group relative block overflow-hidden rounded-2xl border border-[#222] bg-[#161616] transition hover:border-[#ff0618]/50 ${
        tile.featured ? 'md:col-span-2 md:row-span-2' : ''
      }`}
      style={{ aspectRatio: tile.featured ? '1 / 1' : '4 / 5' }}
    >
      <img
        src={tile.src}
        alt={tile.label}
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-90" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-white text-sm font-bold truncate">@{tile.creator.username}</p>
        <p className="text-white/60 text-xs">View profile</p>
      </div>
    </a>
  )
}

// --- Page ---------------------------------------------------------------------

export default function ExplorePage() {
  const [activeTab,         setActiveTab]         = useState<Tab>('explore')
  const [query,             setQuery]             = useState('')
  const [activeGender,      setActiveGender]      = useState('')
  const [ageMin,            setAgeMin]            = useState(AGE_MIN)
  const [ageMax,            setAgeMax]            = useState(AGE_MAX)
  const [distanceMax,       setDistanceMax]       = useState(20)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const hasActiveFilters =
    activeGender !== '' ||
    ageMin !== AGE_MIN ||
    ageMax !== AGE_MAX ||
    (activeTab === 'nearby' && distanceMax < 20)

  const { data, isLoading } = useQuery<{ success: boolean; data: Creator[] }>({
    queryKey: ['creators', query, activeGender, ageMin, ageMax],
    queryFn: () => {
      const params = new URLSearchParams()
      if (query) params.set('search', query)
      if (activeGender)       params.set('gender', activeGender)
      if (ageMin !== AGE_MIN) params.set('ageMin', String(ageMin))
      if (ageMax !== AGE_MAX) params.set('ageMax', String(ageMax))
      return api.get(`/creators?${params.toString()}`).then(r => r.data)
    },
  })

  const allCreators = data?.data ?? []

  const creators = useMemo(() => {
    if (activeTab === 'live')   return allCreators.filter(c => c.creatorProfile?.isLive)
    if (activeTab === 'nearby') return allCreators.filter(c => +stableKm(c.id) <= distanceMax)
    return allCreators
  }, [allCreators, activeTab, distanceMax])

  const imageTiles = useMemo<ImageTile[]>(() => {
    return allCreators
      .map(creator => creator.bannerKey
        ? {
            id: `${creator.id}-banner`,
            creator,
            src: mediaUrl(creator.bannerKey)!,
            label: `${creator.username} cover image`,
            featured: false,
          }
        : null)
      .filter((tile): tile is ImageTile => Boolean(tile))
      .sort((a, b) => shuffleScore(a.id) - shuffleScore(b.id))
      .map((tile, index) => ({ ...tile, featured: index % 7 === 0 }))
  }, [allCreators])

  function clearFilters() {
    setActiveGender('')
    setAgeMin(AGE_MIN)
    setAgeMax(AGE_MAX)
    setDistanceMax(20)
  }

  const filterContent = (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Search</p>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search creators..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-[#1a1a1a] text-white pl-8 pr-3 py-2.5 rounded-xl border border-[#333] focus:border-[#ff0618] focus:outline-none text-sm transition"
          />
        </div>
      </div>

      {/* Sex */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sex</p>
        <div className="space-y-2.5">
          {GENDERS.map(g => (
            <button
              key={g.value}
              onClick={() => setActiveGender(g.value)}
              className="flex items-center gap-3 w-full group"
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                activeGender === g.value ? 'border-[#ff0618]' : 'border-[#444] group-hover:border-[#888]'
              }`}>
                {activeGender === g.value && (
                  <div className="w-2 h-2 rounded-full bg-[#ff0618]" />
                )}
              </div>
              <span className={`text-sm transition ${
                activeGender === g.value ? 'text-white font-medium' : 'text-gray-400 group-hover:text-gray-200'
              }`}>
                {g.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Age dual-range slider */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Age</p>
        <div className="px-1">
          <div className="relative h-6 flex items-center">
            <div className="absolute w-full h-1 bg-[#333] rounded-full" />
            <div
              className="absolute h-1 bg-[#ff0618] rounded-full pointer-events-none"
              style={{
                left:  `${((ageMin - AGE_MIN) / (AGE_MAX - AGE_MIN)) * 100}%`,
                right: `${100 - ((ageMax - AGE_MIN) / (AGE_MAX - AGE_MIN)) * 100}%`,
              }}
            />
            <input
              type="range" min={AGE_MIN} max={AGE_MAX} value={ageMin}
              onChange={e => { const v = +e.target.value; if (v <= ageMax) setAgeMin(v) }}
              className="range-thumb absolute inset-x-0 top-0 w-full appearance-none bg-transparent cursor-pointer"
              style={{ zIndex: ageMin > ageMax - 3 ? 5 : 3 }}
            />
            <input
              type="range" min={AGE_MIN} max={AGE_MAX} value={ageMax}
              onChange={e => { const v = +e.target.value; if (v >= ageMin) setAgeMax(v) }}
              className="range-thumb absolute inset-x-0 top-0 w-full appearance-none bg-transparent cursor-pointer"
              style={{ zIndex: 4 }}
            />
          </div>
          <div className="flex justify-between mt-3 text-xs text-gray-400">
            <span>{ageMin}</span>
            <span>{ageMax === AGE_MAX ? `${AGE_MAX}+` : ageMax}</span>
          </div>
        </div>
      </div>

      {/* Distance - only visible on People Nearby tab */}
      {activeTab === 'nearby' && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Distance (km)</p>
          <div className="px-1">
            <div className="relative h-6 flex items-center">
              <div className="absolute w-full h-1 bg-[#333] rounded-full" />
              <div
                className="absolute h-1 bg-[#ff0618] rounded-full pointer-events-none"
                style={{ left: 0, right: `${100 - (distanceMax / 50) * 100}%` }}
              />
              <input
                type="range" min={1} max={50} value={distanceMax}
                onChange={e => setDistanceMax(+e.target.value)}
                className="range-thumb absolute inset-x-0 top-0 w-full appearance-none bg-transparent cursor-pointer"
                style={{ zIndex: 4 }}
              />
            </div>
            <p className="text-center mt-3 text-xs text-gray-400">0 - {distanceMax} km</p>
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full text-center text-xs text-gray-500 hover:text-[#ff0618] underline transition py-1"
        >
          Clear filters
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#121212]">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Compass size={28} className="text-[#ff0618]" />
            <h1 className="text-3xl font-bold text-white">Discover</h1>
          </div>
          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowMobileFilters(v => !v)}
            className={`lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition ${
              showMobileFilters || hasActiveFilters
                ? 'bg-[#ff0618] border-[#ff0618] text-white'
                : 'bg-[#161616] border-[#222] text-gray-400'
            }`}
          >
            <SlidersHorizontal size={15} />
            Filters
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-white" />}
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex overflow-x-auto border-b border-[#222] mb-6">
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition whitespace-nowrap ${
              activeTab === 'explore'
                ? 'border-[#ff0618] text-[#ff0618]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Compass size={15} />
            Explore
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition whitespace-nowrap ${
              activeTab === 'live'
                ? 'border-[#ff0618] text-[#ff0618]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Wifi size={15} />
            Live Now
            <span className="w-2 h-2 rounded-full bg-[#ff0618] animate-pulse" />
          </button>
          <button
            onClick={() => setActiveTab('nearby')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition whitespace-nowrap ${
              activeTab === 'nearby'
                ? 'border-[#ff0618] text-[#ff0618]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <MapPin size={15} />
            People Nearby
          </button>
          <button
            onClick={() => setActiveTab('profiles')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition whitespace-nowrap ${
              activeTab === 'profiles'
                ? 'border-[#ff0618] text-[#ff0618]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <UserRound size={15} />
            Profiles
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition whitespace-nowrap ${
              activeTab === 'images'
                ? 'border-[#ff0618] text-[#ff0618]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <ImageIcon size={15} />
            Photos
          </button>
        </div>

        <div className="flex gap-6 items-start">

          {/* -- Main content -- */}
          <div className="flex-1 min-w-0">

            {/* Tab subtitles */}
            {activeTab === 'live' && (
              <p className="text-sm text-gray-400 mb-5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff0618] animate-pulse" />
                Creators streaming live right now
              </p>
            )}
            {activeTab === 'nearby' && (
              <p className="text-sm text-gray-400 mb-5 flex items-center gap-2">
                <MapPin size={14} className="text-[#ff0618]" />
                Creators near your location
              </p>
            )}
            {activeTab === 'images' && (
              <p className="text-sm text-gray-400 mb-5 flex items-center gap-2">
                <ImageIcon size={14} className="text-[#ff0618]" />
                Creator photos from profile covers
              </p>
            )}

            {/* Mobile filter drawer */}
            {showMobileFilters && (
              <div className="lg:hidden bg-[#161616] border border-[#222] rounded-2xl p-5 mb-5">
                {filterContent}
              </div>
            )}

            {/* Tab content */}
            {isLoading ? (
              <p className="text-gray-500 text-center py-24">Loading...</p>
            ) : activeTab === 'images' ? (
              imageTiles.length === 0 ? (
                <div className="text-center py-24 text-gray-500">
                  <ImageIcon size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="font-medium">No images found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-fr gap-4">
                  {imageTiles.map(tile => (
                    <RandomImageTile key={tile.id} tile={tile} />
                  ))}
                </div>
              )
            ) : creators.length === 0 ? (
              <div className="text-center py-24 text-gray-500">
                {activeTab === 'live' ? (
                  <>
                    <Wifi size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-medium">No one is live right now</p>
                    <p className="text-sm mt-1 text-gray-600">Check back soon!</p>
                  </>
                ) : activeTab === 'nearby' ? (
                  <>
                    <MapPin size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-medium">No creators nearby</p>
                    <p className="text-sm mt-1 text-gray-600">Try increasing the distance filter</p>
                  </>
                ) : (
                  <>
                    <Compass size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-medium">No creators found</p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {creators.map(creator => (
                  <CreatorCard key={creator.id} creator={creator} tab={activeTab} />
                ))}
              </div>
            )}
          </div>

          {/* -- Right filter sidebar (desktop only) -- */}
          <aside data-testid="filter-sidebar" className="hidden lg:block w-64 shrink-0 sticky top-6">
            <div className="bg-[#161616] border border-[#222] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-[#ff0618]" />
                Filters
              </h3>
              {filterContent}
            </div>
          </aside>

        </div>
      </div>
    </div>
  )
}
