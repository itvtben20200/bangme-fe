import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-brand-dark">
      <header className="flex items-center justify-between px-8 py-6 border-b border-brand-border">
        <div className="text-2xl font-black">
          <span className="text-white">BANG</span>
          <span className="text-brand-red">ME</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="px-5 py-2 rounded-lg border border-brand-border text-brand-text hover:bg-brand-surface transition">
            Log In
          </Link>
          <Link href="/register" className="px-5 py-2 rounded-lg bg-brand-red text-white font-bold hover:bg-red-600 transition">
            Get Started
          </Link>
        </div>
      </header>

      <section className="flex flex-col items-center justify-center text-center py-32 px-4">
        <h1 className="text-5xl font-black text-white mb-4">Your passion. Our platform.</h1>
        <p className="text-xl text-brand-muted mb-8 max-w-xl">
          A modern content platform to connect, create, and share with your audience.
        </p>
        <div className="flex gap-4">
          <Link href="/register" className="px-8 py-3 bg-brand-red text-white font-bold rounded-xl text-lg hover:bg-red-600 transition">
            Start for Free
          </Link>
          <Link href="/explore" className="px-8 py-3 border border-brand-border text-brand-text font-bold rounded-xl text-lg hover:bg-brand-surface transition">
            Explore Creators
          </Link>
        </div>
      </section>
    </main>
  )
}
