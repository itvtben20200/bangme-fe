import Image from 'next/image'
import Link  from 'next/link'
import { mediaUrl } from '@/lib/utils'

/* ─────────────────────────────────────────────────────────────────────────
   FAN-FACING HOMEPAGE  (/):  Entice visitors to sign up and subscribe.
   CREATOR-FACING PAGE (/for-creators): Creator pitch & earning features.
   ───────────────────────────────────────────────────────────────────────── */

/* ─── Types / fetch ─────────────────────────────────────────────────────── */

interface ApiCreator {
  id: string
  username: string
  displayName: string | null
  avatarKey: string | null
  bannerKey: string | null
  bio: string | null
  isVerified: boolean
  creatorProfile: { monthlySubPrice: number | null; isLive: boolean } | null
  _count: { subscribers: number; posts: number }
}

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop&q=80'
const FALLBACK_BANNER = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=300&fit=crop&q=80'

async function fetchFeaturedCreators(): Promise<ApiCreator[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002/api'
    const res = await fetch(`${apiUrl}/creators/featured`, { cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data as ApiCreator[]) ?? []
  } catch {
    return []
  }
}

/* ─── Data ──────────────────────────────────────────────────────────────── */

const STATS = [
  { value: '2M+',   label: 'Creators to Discover' },
  { value: '180M+', label: 'Fans Worldwide' },
  { value: '4.9★',  label: 'Average Creator Rating' },
  { value: '190+',  label: 'Countries' },
]

/* Fallback creators — used if API is unreachable */
const FALLBACK_CREATORS = [
  {
    name: 'Aria Kim',
    handle: 'ariakim',
    category: 'Lifestyle',
    fans: '142K',
    // bikini / two-piece — replace with your own
    img:    'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=400&h=500&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=300&fit=crop&q=80',
    price: '$9.99',
    verified: true,
    posts: 382,
    rating: 4.9,
    newPosts: true,
  },
  {
    name: 'Mia Russo',
    handle: 'miarusso',
    category: 'Fitness',
    fans: '89K',
    img:    'https://images.unsplash.com/photo-1546961342-ea5f62d5a27b?w=400&h=500&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=300&fit=crop&q=80',
    price: '$14.99',
    verified: true,
    posts: 214,
    rating: 4.8,
    newPosts: false,
  },
  {
    name: 'Sofia Vega',
    handle: 'sofiavega',
    category: 'Fashion',
    fans: '230K',
    img:    'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=500&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=300&fit=crop&q=80',
    price: '$19.99',
    verified: true,
    posts: 610,
    rating: 5.0,
    newPosts: true,
  },
  {
    name: 'Leila Nour',
    handle: 'leilanour',
    category: 'Dance',
    fans: '67K',
    img:    'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&h=500&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800&h=300&fit=crop&q=80',
    price: '$7.99',
    verified: false,
    posts: 98,
    rating: 4.7,
    newPosts: true,
  },
  {
    name: 'Nadia Chen',
    handle: 'nadiachen',
    category: 'Art',
    fans: '41K',
    img:    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=300&fit=crop&q=80',
    price: '$12.99',
    verified: false,
    posts: 145,
    rating: 4.6,
    newPosts: false,
  },
  {
    name: 'Luna Park',
    handle: 'lunapark',
    category: 'Music',
    fans: '115K',
    img:    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=300&fit=crop&q=80',
    price: '$11.99',
    verified: true,
    posts: 290,
    rating: 4.9,
    newPosts: true,
  },
]

const TEASER_LABELS = ['🔒 Exclusive Post', '📸 New Photos', '🎥 Full Video', '🔒 PPV Content', '🎨 Behind the Scenes', '🎵 Live Recording']

const CATEGORIES = [
  { label: 'Asian',      emoji: '🌸', count: '38K creators', img: 'https://as1.ftcdn.net/v2/jpg/01/80/98/02/1000_F_180980255_hlTERLsznaAMZJx9mGMNAekPHK7lqobO.jpg' },
  { label: 'Western',    emoji: '⭐', count: '52K creators', img: 'https://as1.ftcdn.net/v2/jpg/02/13/78/28/1000_F_213782882_T6V0EGER5uUBHK53czKmGukS4OzUzB9I.jpg' },
  { label: 'Latina',     emoji: '🔥', count: '21K creators', img: 'https://as2.ftcdn.net/v2/jpg/01/71/15/23/1000_F_171152370_R6euKSaJk5Wd8fwXfMKQ8FUQmZ53ZRtr.jpg' },
  { label: 'Ebony',      emoji: '💫', count: '17K creators', img: 'https://as2.ftcdn.net/v2/jpg/06/33/04/71/1000_F_633047160_NXTTJqAmdZcJZ3n7tSSCBxWQ7ckfe8yy.jpg' },
  { label: 'Fitness',    emoji: '💪', count: '14K creators', img: 'https://as1.ftcdn.net/v2/jpg/01/42/67/88/1000_F_142678821_E2ffJmC0LSUMuz4JUM46u8LCgYOizte4.jpg' },
  { label: 'Cosplay',    emoji: '🎭', count: '9K creators',  img: 'https://as2.ftcdn.net/v2/jpg/03/77/39/85/1000_F_377398571_r7WYoec13GdgF1kxwwvowAp7sSBJmBOU.jpg' },
  { label: 'Couples',    emoji: '💑', count: '6K creators',  img: 'https://as2.ftcdn.net/v2/jpg/02/31/34/07/1000_F_231340726_3An9aKi9gJ8D17S88k6fTx0b9KoWlyLe.jpg' },
  { label: 'Live Only',  emoji: '🔴', count: '4K live now',  img: 'https://as1.ftcdn.net/v2/jpg/04/78/72/50/1000_F_478725074_Gg2zIkfhkBeJJyMStCZFWvGGQemZB3Jj.jpg' },
  { label: 'New Faces',  emoji: '✨', count: '1.2K new',     img: 'https://as1.ftcdn.net/v2/jpg/01/80/98/02/1000_F_180980255_hlTERLsznaAMZJx9mGMNAekPHK7lqobO.jpg' },
]

const FAN_STEPS = [
  { icon: '✍️', title: 'Create a Free Account',    desc: 'Sign up in under 30 seconds. No credit card needed to browse.' },
  { icon: '🔍', title: 'Discover Your Favourites', desc: 'Browse 2M+ creators by category, popularity, or price.' },
  { icon: '🔓', title: 'Subscribe & Unlock',       desc: 'Starting from $4.99/mo — cancel any time. Unlock photos, videos, lives, and DMs.' },
]

const FAN_TESTIMONIALS = [
  {
    quote: 'I spend less than a coffee a day and get daily exclusive content from my 3 favourite creators. Worth every cent.',
    name: 'Jake M.',
    role: 'Subscriber since 2024',
    avatar: '🙋‍♂️',
  },
  {
    quote: 'Being able to DM creators directly and actually get replies is something no other platform offers.',
    name: 'Priya S.',
    role: 'Fan · 8 active subs',
    avatar: '🙋‍♀️',
  },
  {
    quote: 'The exclusive live streams are insane. Felt like a private show just for me.',
    name: 'Marcus T.',
    role: 'Subscriber since 2025',
    avatar: '🙋',
  },
]

/* ─── Component ─────────────────────────────────────────────────────────── */

export default async function LandingPage() {
  const apiCreators = await fetchFeaturedCreators()

  const FEATURED_CREATORS = apiCreators.length > 0
    ? apiCreators.map(c => ({
        name:     c.displayName ?? c.username,
        handle:   c.username,
        fans:     c._count.subscribers >= 1000
          ? `${(c._count.subscribers / 1000).toFixed(0)}K`
          : String(c._count.subscribers),
        img:      mediaUrl(c.avatarKey) ?? FALLBACK_AVATAR,
        banner:   mediaUrl(c.bannerKey) ?? FALLBACK_BANNER,
        price:    `$${c.creatorProfile?.monthlySubPrice ?? '9.99'}`,
        verified: c.isVerified,
        posts:    c._count.posts,
        isLive:   c.creatorProfile?.isLive ?? false,
        newPosts: c._count.posts > 0,
        rating:   4.9,
        category: 'Creator',
      }))
    : FALLBACK_CREATORS

  const TEASERS = FEATURED_CREATORS.slice(0, 6).map((c, i) => ({
    img:     c.img,
    creator: c.name,
    label:   TEASER_LABELS[i % TEASER_LABELS.length],
  }))

  return (
    <div className="min-h-screen bg-brand-dark text-white overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-brand-dark/80 backdrop-blur-md border-b border-brand-border">
        <div className="text-2xl font-black tracking-tight">
          <span className="text-white">BANG</span>
          <span className="text-brand-red">ME</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-brand-muted">
          <Link href="/explore"      className="hover:text-white transition">Explore</Link>
          <a href="#creators"        className="hover:text-white transition">Creators</a>
          <a href="#categories"      className="hover:text-white transition">Categories</a>
          <a href="#how-it-works"    className="hover:text-white transition">How It Works</a>
          <Link href="/for-creators" className="text-brand-red hover:text-red-400 transition font-semibold">For Creators ↗</Link>
        </nav>
        <div className="flex gap-3">
          <Link href="/login"    className="px-5 py-2 rounded-lg border border-brand-border text-brand-text text-sm hover:bg-brand-surface transition">Log In</Link>
          <Link href="/register" className="px-5 py-2 rounded-lg bg-brand-red text-white font-bold text-sm hover:bg-red-600 transition">Subscribe Now</Link>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <video
          src="https://v.ftcdn.net/02/10/68/96/700_F_210689610_t6AlbRjc5MHqd3RyB569sM3bUYnizbpj_ST.mp4"
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/75 to-brand-dark/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-brand-dark/20" />

        <div className="relative z-10 px-6 md:px-20 max-w-3xl">
          <span className="inline-block px-3 py-1 rounded-full bg-brand-red/20 border border-brand-red/40 text-brand-red text-xs font-semibold tracking-widest uppercase mb-6">
            🔒 Exclusive Content. No Free Passes.
          </span>
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
            The content<br />
            you <span className="text-brand-red">can&apos;t</span><br />
            find anywhere else.
          </h1>
          <p className="text-lg md:text-xl text-brand-text mb-10 leading-relaxed max-w-xl">
            Subscribe to your favourite creators and unlock exclusive photos, videos, live streams, and direct messages. Premium access starts from $7.99/mo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/register" className="px-10 py-4 bg-brand-red text-white font-black text-lg rounded-xl hover:bg-red-600 transition text-center">
              Create Account &amp; Subscribe
            </Link>
            <Link href="/explore"  className="px-10 py-4 bg-white/10 border border-white/20 text-white font-bold text-lg rounded-xl hover:bg-white/20 transition backdrop-blur-sm text-center">
              Browse Creators →
            </Link>
          </div>
          <p className="text-brand-muted text-sm mt-4">Starting from <span className="text-white font-semibold">$7.99/mo</span> · Cancel any time · Powered by Stripe</p>
        </div>

        {/* Floating creator pills — decorative */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-3 z-10">
          {FEATURED_CREATORS.slice(0, 3).map(c => (
            <div key={c.handle} className="flex items-center gap-3 bg-brand-dark/70 backdrop-blur border border-brand-border rounded-full px-4 py-2">
              <Image src={c.img} alt={c.name} width={36} height={36} className="rounded-full object-cover w-9 h-9" />
              <div>
                <p className="text-sm font-bold leading-none">{c.name}</p>
                <p className="text-brand-muted text-xs">{c.price}/mo</p>
              </div>
              <span className="ml-1 text-xs bg-brand-red text-white rounded-full px-2 py-0.5 font-bold">Subscribe</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats Bar ──────────────────────────────────────────────────── */}
      <section className="bg-brand-surface border-y border-brand-border py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="text-4xl font-black text-brand-red mb-1">{s.value}</p>
              <p className="text-brand-muted text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Locked Content Teaser Grid ─────────────────────────────────── */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-brand-red text-sm font-semibold tracking-widest uppercase mb-2">What&apos;s Inside</p>
          <h2 className="text-4xl font-black">Exclusive Content Waiting for You</h2>
          <p className="text-brand-muted mt-3 max-w-md mx-auto text-sm">
            Join free to see full previews. Subscribe to unlock everything.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {TEASERS.map((t, i) => (
            <Link
              key={i}
              href="/register"
              className="group relative overflow-hidden rounded-2xl border border-brand-border hover:border-brand-red/50 transition aspect-[4/5]"
            >
              <Image src={t.img} alt={`${t.creator} teaser`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/10 to-transparent" />
              <div className="absolute top-3 right-3 bg-brand-red/90 rounded-lg px-2 py-1 text-xs font-bold">
                🔒 Subscribers Only
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-xs text-brand-muted mb-1">{t.creator}</p>
                <p className="font-bold text-sm">{t.label}</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <span className="bg-brand-red text-white font-black px-6 py-2.5 rounded-xl text-sm shadow-xl">
                  Subscribe to Unlock
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/register" className="inline-block px-10 py-4 bg-brand-red text-white font-black rounded-xl hover:bg-red-600 transition text-lg">
            Join Free to See More →
          </Link>
        </div>
      </section>

      {/* ── Featured Creators ──────────────────────────────────────────── */}
      <section id="creators" className="bg-brand-surface border-y border-brand-border py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-brand-red text-sm font-semibold tracking-widest uppercase mb-2">Who&apos;s Hot Right Now</p>
              <h2 className="text-4xl font-black">Featured Creators</h2>
            </div>
            <Link href="/explore" className="text-brand-red text-sm font-semibold hover:underline hidden md:block">
              See All 2M+ Creators →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED_CREATORS.map(c => (
              <div key={c.handle} className="group bg-brand-card border border-brand-border rounded-2xl overflow-hidden hover:border-brand-red/50 transition-all hover:shadow-2xl hover:shadow-brand-red/10 hover:-translate-y-1">
                <div className="relative h-36 overflow-hidden">
                  <Image src={c.banner} alt={`${c.name} banner`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-card to-transparent" />
                  {c.newPosts && (
                    <span className="absolute top-3 left-3 bg-brand-red text-white text-xs font-bold px-2 py-1 rounded-full">🔴 New</span>
                  )}
                </div>
                <div className="px-5 -mt-10 relative z-10">
                  <div className="w-20 h-20 rounded-full border-4 border-brand-card overflow-hidden">
                    <Image src={c.img} alt={c.name} width={80} height={80} className="object-cover w-full h-full" />
                  </div>
                </div>
                <div className="px-5 pt-3 pb-5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-lg">{c.name}</span>
                    {c.verified && <span className="text-brand-red text-xs bg-brand-red/10 rounded-full px-2 py-0.5">✓</span>}
                  </div>
                  <p className="text-brand-muted text-sm mb-1">@{c.handle} · {c.category}</p>
                  <p className="text-brand-muted text-xs mb-4">
                    {c.posts} posts · <span className="text-yellow-400">★ {c.rating}</span> · <span className="text-white font-semibold">{c.fans}</span> fans
                  </p>
                  <Link
                    href={`/subscribe/${c.handle}`}
                    className="block w-full text-center bg-brand-red text-white font-bold py-2.5 rounded-xl text-sm hover:bg-red-600 transition"
                  >
                    💳 Subscribe {c.price}/mo
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works — for fans ─────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand-red text-sm font-semibold tracking-widest uppercase mb-2">Super Easy</p>
            <h2 className="text-4xl font-black">How It Works for Fans</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {FAN_STEPS.map((step, i) => (
              <div key={i} className="bg-brand-card border border-brand-border rounded-2xl p-8 text-center hover:border-brand-red/40 transition">
                <div className="text-5xl mb-5">{step.icon}</div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-brand-muted text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/register" className="inline-block px-10 py-4 bg-brand-red text-white font-black text-lg rounded-xl hover:bg-red-600 transition">
              Create Account &amp; Subscribe →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Fan Benefits ───────────────────────────────────────────────── */}
      <section className="bg-brand-surface border-y border-brand-border py-24 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-brand-red text-sm font-semibold tracking-widest uppercase mb-3">Why Fans Love BANGME</p>
            <h2 className="text-4xl font-black leading-tight mb-8">
              More than a feed.<br />
              A real<br />
              <span className="text-brand-red">connection.</span>
            </h2>
            <ul className="space-y-5">
              {[
                { icon: '🔓', title: 'Truly Exclusive Content',  desc: "Content you can't find on Instagram or TikTok — only for subscribers." },
                { icon: '💬', title: 'Direct Message Creators',  desc: 'Chat 1-on-1 with your favourite creators. Real replies, real connection.' },
                { icon: '🔴', title: 'Private Live Streams',     desc: 'Watch subscriber-only lives in intimate sessions. Send virtual gifts live.' },
                { icon: '📸', title: 'Pay-Per-View Posts',       desc: 'Unlock individual premium posts when you want — no full sub required.' },
                { icon: '🛡️', title: 'Cancel Any Time',          desc: 'No long-term commitment. Subscribe and cancel with one click.' },
              ].map(b => (
                <li key={b.title} className="flex gap-4 items-start">
                  <span className="text-2xl mt-0.5">{b.icon}</span>
                  <div>
                    <p className="font-bold mb-0.5">{b.title}</p>
                    <p className="text-brand-muted text-sm leading-relaxed">{b.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Replace this photo with your own */}
          <div className="relative h-[560px] rounded-3xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=900&h=1100&fit=crop&q=85"
              alt="Creator exclusive content — replace with your own"
              fill className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-transparent" />
            <div className="absolute top-5 left-5 bg-brand-dark/80 backdrop-blur border border-brand-border rounded-xl px-4 py-3">
              <p className="text-xs text-brand-muted">New subscribers today</p>
              <p className="text-2xl font-black text-brand-red">+4,821</p>
            </div>
            <div className="absolute bottom-6 left-6 right-6 bg-brand-dark/80 backdrop-blur border border-brand-border rounded-xl p-4 flex items-center gap-4">
              <span className="text-3xl">🔒</span>
              <div className="flex-1">
                <p className="font-bold text-sm">Subscribe to unlock 382 exclusive posts</p>
                <p className="text-brand-muted text-xs">From $9.99/mo · Stripe-secured · Cancel any time</p>
              </div>
              <Link href="/register" className="bg-brand-red text-white font-bold text-xs px-3 py-2 rounded-lg hover:bg-red-600 transition whitespace-nowrap">
                Subscribe
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────────────────────── */}
      <section id="categories" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-brand-red text-sm font-semibold tracking-widest uppercase mb-2">Find Your Type</p>
            <h2 className="text-4xl font-black">Browse by Category</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.label}
                href={`/explore?category=${encodeURIComponent(cat.label.toLowerCase())}`}
                className="group relative h-44 rounded-2xl overflow-hidden border border-brand-border hover:border-brand-red/60 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-red/10"
              >
                <Image src={cat.img} alt={cat.label} fill className="object-cover object-top group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                {cat.label === 'Live Only' && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-brand-red text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                    LIVE
                  </div>
                )}
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-sm font-black leading-tight">{cat.emoji} {cat.label}</p>
                  <p className="text-brand-muted text-xs mt-0.5">{cat.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fan Testimonials ───────────────────────────────────────────── */}
      <section className="bg-brand-surface border-y border-brand-border py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-brand-red text-sm font-semibold tracking-widest uppercase mb-2">From Our Community</p>
            <h2 className="text-4xl font-black">Fans Love BANGME</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FAN_TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-brand-card border border-brand-border rounded-2xl p-7 flex flex-col gap-4 hover:border-brand-red/30 transition">
                <p className="text-brand-text leading-relaxed text-sm flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-brand-border">
                  <span className="text-3xl">{t.avatar}</span>
                  <div>
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-brand-muted text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      {/* Replace CTA background image */}
      <section className="relative py-32 px-6 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=1800&h=700&fit=crop&q=80"
          alt="CTA background — replace with your own"
          fill className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-brand-dark/88" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-5xl font-black mb-6">
            Your favourite creators<br />
            are waiting for <span className="text-brand-red">you.</span>
          </h2>
          <p className="text-brand-text text-lg mb-10 leading-relaxed">
            2M+ creators. Subscriptions from $7.99/mo. Powered by Stripe. Cancel any time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="px-12 py-4 bg-brand-red text-white font-black text-lg rounded-xl hover:bg-red-600 transition">
              💳 Subscribe Now
            </Link>
            <Link href="/explore"  className="px-12 py-4 bg-white/10 border border-white/20 text-white font-bold text-lg rounded-xl hover:bg-white/20 transition">
              Explore Creators
            </Link>
          </div>
          <p className="text-brand-muted text-sm mt-6">
            Are you a creator?{' '}
            <Link href="/for-creators" className="text-brand-red hover:underline">Start earning here →</Link>
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="bg-brand-surface border-t border-brand-border py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
            <div className="col-span-2">
              <div className="text-2xl font-black mb-3">
                <span className="text-white">BANG</span>
                <span className="text-brand-red">ME</span>
              </div>
              <p className="text-brand-muted text-sm leading-relaxed max-w-xs">
                The world&apos;s most exciting creator subscription platform. Exclusive content, real connections.
              </p>
            </div>
            {[
              {
                title: 'Discover',
                links: ['All Creators', 'Fitness', 'Fashion', 'Music'],
                hrefs: ['/explore', '/explore?category=fitness', '/explore?category=fashion', '/explore?category=music'],
              },
              {
                title: 'For Fans',
                links: ['How It Works', 'Pricing', 'Gift Cards', 'Support'],
                hrefs: ['#how-it-works', '#', '#', '#'],
              },
              {
                title: 'For Creators',
                links: ['Start Earning', 'Creator Center', 'Payouts', 'Community'],
                hrefs: ['/for-creators', '/creator-center', '/creator-center', '#'],
              },
            ].map(col => (
              <div key={col.title}>
                <p className="text-white font-semibold text-sm mb-4">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map((l, i) => (
                    <li key={l}>
                      <Link href={col.hrefs[i]} className="text-brand-muted text-sm hover:text-white transition">{l}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-brand-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-brand-muted text-xs">© 2026 BANGME. All rights reserved.</p>
            <div className="flex gap-6">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', '18 U.S.C. 2257'].map(l => (
                <Link key={l} href="#" className="text-brand-muted text-xs hover:text-white transition">{l}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}

