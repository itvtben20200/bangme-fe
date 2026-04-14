import Image from 'next/image'
import Link from 'next/link'

/* ─── Data ──────────────────────────────────────────────────────────────── */

const STATS = [
  { value: '2M+',   label: 'Active Creators' },
  { value: '$500M+',label: 'Paid to Creators' },
  { value: '80%',   label: 'Revenue Split You Keep' },
  { value: '190+',  label: 'Countries Supported' },
]

const STEPS = [
  {
    num: '01',
    title: 'Create Your Profile',
    desc: 'Sign up in seconds. Set your subscription price, upload a banner, and write your bio. Your page goes live instantly.',
    icon: '✦',
  },
  {
    num: '02',
    title: 'Share Exclusive Content',
    desc: 'Post photos, videos, audio, and live streams. Lock content behind your paywall or offer free teasers to hook fans.',
    icon: '✦',
  },
  {
    num: '03',
    title: 'Get Paid Every Day',
    desc: 'Earn from subscriptions, tips, pay-per-view posts, and live gifts. We process payouts daily — straight to your bank.',
    icon: '✦',
  },
]

const TESTIMONIALS = [
  {
    quote: 'I quit my 9-to-5 within 3 months. BANGME handles everything so I can focus on creating.',
    name: 'Aria K.',
    role: 'Lifestyle Creator · 142K fans',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80',
  },
  {
    quote: 'The daily payouts are a game-changer. I\'ve never felt more financially free.',
    name: 'Sofia V.',
    role: 'Fashion Creator · 230K fans',
    img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&q=80',
  },
  {
    quote: 'PPV posts alone doubled my income in the first week. The platform just works.',
    name: 'Luna P.',
    role: 'Music Creator · 115K fans',
    img: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&h=100&fit=crop&q=80',
  },
]

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function ForCreatorsPage() {
  return (
    <div className="min-h-screen bg-brand-dark text-white overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-brand-dark/80 backdrop-blur-md border-b border-brand-border">
        <Link href="/" className="text-2xl font-black tracking-tight">
          <span className="text-white">BANG</span>
          <span className="text-brand-red">ME</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-brand-muted">
          <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
          <a href="#earnings"     className="hover:text-white transition">Earnings</a>
          <a href="#testimonials" className="hover:text-white transition">Stories</a>
          <Link href="/"          className="hover:text-white transition">For Fans</Link>
        </nav>
        <div className="flex gap-3">
          <Link href="/login"    className="px-5 py-2 rounded-lg border border-brand-border text-brand-text text-sm hover:bg-brand-surface transition">Log In</Link>
          <Link href="/register" className="px-5 py-2 rounded-lg bg-brand-red text-white font-bold text-sm hover:bg-red-600 transition">Start Earning</Link>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      {/* Replace hero background image */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=1800&h=1000&fit=crop&q=85"
          alt="Creator hero — replace with your own"
          fill priority
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-brand-dark/30" />

        <div className="relative z-10 px-6 md:px-20 max-w-3xl">
          <span className="inline-block px-3 py-1 rounded-full bg-brand-red/20 border border-brand-red/40 text-brand-red text-xs font-semibold tracking-widest uppercase mb-6">
            Built for Creators
          </span>
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
            Own Your<br />
            <span className="text-brand-red">Desire.</span><br />
            Name Your Price.
          </h1>
          <p className="text-lg md:text-xl text-brand-text mb-10 leading-relaxed max-w-xl">
            The boldest creator platform on the internet. Connect with your fans, monetise your content, and get paid every single day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/register" className="px-10 py-4 bg-brand-red text-white font-black text-lg rounded-xl hover:bg-red-600 transition text-center">
              Start Earning Free
            </Link>
            <Link href="/" className="px-10 py-4 bg-white/10 border border-white/20 text-white font-bold text-lg rounded-xl hover:bg-white/20 transition backdrop-blur-sm text-center">
              Browse as Fan →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
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

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand-red text-sm font-semibold tracking-widest uppercase mb-2">Simple & Powerful</p>
            <h2 className="text-4xl font-black">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {STEPS.map(step => (
              <div key={step.num} className="relative bg-brand-card border border-brand-border rounded-2xl p-8 hover:border-brand-red/40 transition group">
                <div className="text-6xl font-black text-brand-red/10 group-hover:text-brand-red/20 transition absolute top-6 right-6 leading-none select-none">
                  {step.num}
                </div>
                <div className="text-brand-red text-2xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-brand-muted leading-relaxed text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Creator Benefits ───────────────────────────────────────────── */}
      <section id="earnings" className="bg-brand-surface border-y border-brand-border py-24 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          {/* Replace with your preferred creator photo */}
          <div className="relative h-[520px] rounded-3xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&h=1100&fit=crop&q=85"
              alt="Creator spotlight — replace with your own"
              fill className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 bg-brand-dark/70 backdrop-blur border border-brand-border rounded-xl p-4">
              <p className="text-xs text-brand-muted uppercase tracking-widest mb-1">Sofia Vega · Fashion Creator</p>
              <p className="font-bold text-sm">"I make more in a week than I did in a month at my old job."</p>
            </div>
          </div>

          <div>
            <p className="text-brand-red text-sm font-semibold tracking-widest uppercase mb-3">Built for Creators</p>
            <h2 className="text-4xl font-black leading-tight mb-8">
              The platform<br />that pays you<br />
              <span className="text-brand-red">every day.</span>
            </h2>
            <ul className="space-y-5">
              {[
                { icon: '💰', title: 'Daily Payouts',        desc: 'Never wait for end of month. Earnings hit your account every 24 hours.' },
                { icon: '🔒', title: 'You Own Your Content', desc: 'Full copyright stays with you. We never license your content to third parties.' },
                { icon: '📊', title: 'Real-time Analytics',  desc: 'Track every view, tip, and subscription. Know exactly what your fans love.' },
                { icon: '🎯', title: 'PPV & Tips',           desc: 'Charge per post, set custom tip menus, and unlock extra with direct messages.' },
                { icon: '🔴', title: 'Live Streaming',       desc: 'Go live and earn gifts in real time. BANGME keeps only 20% — you keep 80%.' },
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
            <Link href="/register" className="inline-block mt-10 px-10 py-4 bg-brand-red text-white font-black rounded-xl hover:bg-red-600 transition">
              Become a Creator →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────── */}
      <section id="testimonials" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-brand-red text-sm font-semibold tracking-widest uppercase mb-2">Real Stories</p>
          <h2 className="text-4xl font-black">Creators Love BANGME</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="bg-brand-card border border-brand-border rounded-2xl p-7 flex flex-col gap-4 hover:border-brand-red/30 transition">
              <p className="text-brand-text leading-relaxed text-sm flex-1">"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-brand-border">
                <Image src={t.img} alt={t.name} width={44} height={44} className="rounded-full object-cover w-11 h-11" />
                <div>
                  <p className="font-bold text-sm">{t.name}</p>
                  <p className="text-brand-muted text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      {/* Replace CTA background image */}
      <section className="relative py-32 px-6 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=1800&h=700&fit=crop&q=80"
          alt="CTA background — replace with your own"
          fill className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-brand-dark/85" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-5xl font-black mb-6">
            Ready to start<br />
            <span className="text-brand-red">earning?</span>
          </h2>
          <p className="text-brand-text text-lg mb-10">
            Join over 2 million creators. Free to sign up — we only earn when you earn.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="px-12 py-4 bg-brand-red text-white font-black text-lg rounded-xl hover:bg-red-600 transition">
              Create My Page — Free
            </Link>
            <Link href="/" className="px-12 py-4 bg-white/10 border border-white/20 text-white font-bold text-lg rounded-xl hover:bg-white/20 transition">
              Browse as Fan
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="bg-brand-surface border-t border-brand-border py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-black">
            <span className="text-white">BANG</span>
            <span className="text-brand-red">ME</span>
          </Link>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy', '18 U.S.C. 2257'].map(l => (
              <Link key={l} href="#" className="text-brand-muted text-xs hover:text-white transition">{l}</Link>
            ))}
          </div>
          <p className="text-brand-muted text-xs">© 2026 BANGME. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
