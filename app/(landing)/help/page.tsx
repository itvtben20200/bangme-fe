'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Search, ChevronRight, HelpCircle, CreditCard, MessageSquare, Shield, User, Video } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PublicHeader } from '@/components/PublicHeader'
import { useI18n } from '@/lib/i18n'

const categories = [
  {
    icon: User,
    title: 'Account & Profile',
    articles: [
      'How to create an account',
      'How to reset your password',
      'How to update your profile photo',
      'How to change your username',
      'How to deactivate your account',
    ],
  },
  {
    icon: CreditCard,
    title: 'BangCoins & Payments',
    articles: [
      'What are BangCoins?',
      'How to top up BangCoins',
      'How to cash out as a creator',
      'Transaction history and receipts',
      'Supported payment methods',
    ],
  },
  {
    icon: MessageSquare,
    title: 'Messaging',
    articles: [
      'How messaging works',
      'Why do messages cost BangCoins?',
      'How to send media in messages',
      'How to block a user',
      'Message delivery and read receipts',
    ],
  },
  {
    icon: Video,
    title: 'Live Streaming',
    articles: [
      'How to go live',
      'How to join a live stream',
      'Live stream tipping',
      'Technical requirements for streaming',
      'How to end a stream',
    ],
  },
  {
    icon: Shield,
    title: 'Safety & Privacy',
    articles: [
      'How to report a user',
      'Community guidelines overview',
      'What Ghost Mode does',
      'How to control who can see your content',
      'How to manage blocked users',
    ],
  },
  {
    icon: HelpCircle,
    title: 'Creator Tools',
    articles: [
      'How to become a creator',
      'Setting subscription prices',
      'Paid content and unlocking posts',
      'Creator analytics overview',
      'Payout timelines and fees',
    ],
  },
]

const popularArticles = [
  'What are BangCoins?',
  'How to reset your password',
  'How messaging works',
  'How to become a creator',
  'How to go live',
]

const HELP_COPY = {
  en: {
    heroTitle: 'How can we help?',
    heroBody: 'Search our Help Center or browse categories below.',
    searchPlaceholder: 'Search help articles...',
    popularTitle: 'Popular Articles',
    browseTitle: 'Browse by Category',
    noArticles: (search: string) => `No articles found for "${search}"`,
    contactInstead: 'Contact support instead',
    stillNeedHelp: 'Still need help?',
    supportAvailable: 'Our support team is available 7 days a week.',
    contactSupport: 'Contact Support',
    reportIssue: 'Report an Issue',
    popularArticles,
    categories,
  },
  de: {
    heroTitle: 'Wie können wir helfen?',
    heroBody: 'Durchsuche unser Help Center oder stöbere unten nach Kategorien.',
    searchPlaceholder: 'Hilfeartikel suchen...',
    popularTitle: 'Beliebte Artikel',
    browseTitle: 'Nach Kategorie stöbern',
    noArticles: (search: string) => `Keine Artikel für "${search}" gefunden`,
    contactInstead: 'Stattdessen Support kontaktieren',
    stillNeedHelp: 'Brauchst du weitere Hilfe?',
    supportAvailable: 'Unser Support-Team ist 7 Tage die Woche erreichbar.',
    contactSupport: 'Support kontaktieren',
    reportIssue: 'Problem melden',
    popularArticles: [
      'Was sind BangCoins?',
      'Wie setze ich mein Passwort zurück?',
      'Wie funktionieren Nachrichten?',
      'Wie werde ich Creator?',
      'Wie gehe ich live?',
    ],
    categories: [
      { icon: User, title: 'Konto & Profil', articles: ['Konto erstellen', 'Passwort zurücksetzen', 'Profilfoto aktualisieren', 'Benutzernamen ändern', 'Konto deaktivieren'] },
      { icon: CreditCard, title: 'BangCoins & Zahlungen', articles: ['Was sind BangCoins?', 'BangCoins aufladen', 'Als Creator auszahlen lassen', 'Transaktionsverlauf und Belege', 'Unterstützte Zahlungsmethoden'] },
      { icon: MessageSquare, title: 'Nachrichten', articles: ['Wie Nachrichten funktionieren', 'Warum kosten Nachrichten BangCoins?', 'Medien in Nachrichten senden', 'Nutzer blockieren', 'Zustellung und Lesebestätigungen'] },
      { icon: Video, title: 'Livestreaming', articles: ['Live gehen', 'Einem Livestream beitreten', 'Trinkgeld im Livestream', 'Technische Anforderungen fürs Streaming', 'Stream beenden'] },
      { icon: Shield, title: 'Sicherheit & Datenschutz', articles: ['Nutzer melden', 'Community-Richtlinien im Überblick', 'Was Ghost Mode macht', 'Sichtbarkeit deiner Inhalte steuern', 'Blockierte Nutzer verwalten'] },
      { icon: HelpCircle, title: 'Creator-Tools', articles: ['Creator werden', 'Abo-Preise festlegen', 'Bezahlte Inhalte und Beiträge freischalten', 'Creator-Analytics im Überblick', 'Auszahlungszeiten und Gebühren'] },
    ],
  },
}

export default function HelpPage() {
  const [search, setSearch] = useState('')
  const router = useRouter()
  const { language } = useI18n()
  const copy = HELP_COPY[language]

  const filtered = search.trim()
    ? copy.categories.map(c => ({
        ...c,
        articles: c.articles.filter(a => a.toLowerCase().includes(search.toLowerCase())),
      })).filter(c => c.articles.length > 0)
    : copy.categories

  return (
    <div className="min-h-screen bg-brand-dark text-brand-text font-sans">
      {/* Header */}
      <PublicHeader />

      {/* Hero + search */}
      <section className="pt-16 pb-10 text-center px-4 bg-gradient-to-b from-[#1a0000] to-brand-dark">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">{copy.heroTitle}</h1>
        <p className="text-brand-muted mb-8 max-w-xl mx-auto">{copy.heroBody}</p>
        <div className="relative max-w-lg mx-auto">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={copy.searchPlaceholder}
            className="w-full bg-[#1e1e1e] border border-[#333] text-white pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff0618] text-sm"
          />
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 pb-20">
        {/* Popular articles */}
        {!search && (
          <section className="mb-12">
            <h2 className="text-white font-bold text-lg mb-4">{copy.popularTitle}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {copy.popularArticles.map(a => (
                <button key={a} className="flex items-center justify-between bg-[#161616] hover:bg-[#1e1e1e] border border-[#222] hover:border-[#444] rounded-xl px-4 py-3 text-left transition group">
                  <span className="text-sm text-gray-300 group-hover:text-white">{a}</span>
                  <ChevronRight size={14} className="text-gray-500 group-hover:text-[#ff0618] shrink-0" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        <section>
          {!search && <h2 className="text-white font-bold text-lg mb-4">{copy.browseTitle}</h2>}
          {search && filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">{copy.noArticles(search)}</p>
              <button onClick={() => router.push('/contact')} className="mt-4 text-[#ff0618] hover:underline text-sm">
                {copy.contactInstead}
              </button>
            </div>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(cat => {
              const Icon = cat.icon
              return (
                <div key={cat.title} className="bg-[#161616] border border-[#222] rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-[#ff0618]/15 flex items-center justify-center">
                      <Icon size={18} className="text-[#ff0618]" />
                    </div>
                    <h3 className="text-white font-semibold text-sm">{cat.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {cat.articles.map(a => (
                      <li key={a}>
                        <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition w-full text-left group">
                          <ChevronRight size={12} className="text-[#ff0618] shrink-0 opacity-0 group-hover:opacity-100 transition" />
                          {a}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>

        {/* Still need help */}
        <section className="mt-16 text-center bg-[#161616] border border-[#222] rounded-2xl p-10">
          <h2 className="text-white font-bold text-xl mb-2">{copy.stillNeedHelp}</h2>
          <p className="text-gray-400 text-sm mb-6">{copy.supportAvailable}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contact" className="bg-[#ff0618] hover:bg-red-500 text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm">
              {copy.contactSupport}
            </Link>
            <Link href="/report-issue" className="bg-[#222] hover:bg-[#333] text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm">
              {copy.reportIssue}
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
