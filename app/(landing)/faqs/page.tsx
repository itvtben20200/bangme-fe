'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { useI18n } from '@/lib/i18n'

const categories = [
  {
    label: 'Account & Registration',
    faqs: [
      { q: 'How do I create an account?', a: 'Click "Sign up" on the homepage and fill in your email, username, and password. You will receive a verification email to activate your account.' },
      { q: 'I forgot my password. What do I do?', a: 'Click "Forgot password?" on the login page and enter your email. We\'ll send you a secure reset link valid for 1 hour.' },
      { q: 'Can I change my username?', a: 'Usernames can be changed once every 30 days. Go to Settings → Profile and update the Username field.' },
      { q: 'How do I verify my account?', a: 'Account verification is available for creators with an established following. Apply through the Creator Center.' },
    ],
  },
  {
    label: 'BangCoins & Payments',
    faqs: [
      { q: 'What are BangCoins?', a: 'BangCoins are the in-app currency used to send messages to creators, unlock paid content, send tips, and pay for audio/video calls. 1 BangCoin ≈ $1 USD.' },
      { q: 'How do I top up BangCoins?', a: 'Go to the BangCoins page from the sidebar, select a package or enter a custom amount, and pay via card (Stripe). Coins appear in your balance instantly.' },
      { q: 'Are BangCoins refundable?', a: 'BangCoins are non-refundable once purchased except in cases of unauthorized use. Contact support if you believe your account was compromised.' },
      { q: 'What payment methods are supported?', a: 'We accept all major credit and debit cards through Stripe. Google Pay and Apple Pay are available on supported devices.' },
    ],
  },
  {
    label: 'Creators',
    faqs: [
      { q: 'How do I become a creator?', a: 'Go to Settings → Become a Creator (or use the sidebar link). Once upgraded, you can set subscription prices, upload paid content, and receive BangCoins.' },
      { q: 'How does the 80/20 revenue split work?', a: 'You receive 80% of all BangCoins spent on your content (messages, tips, subscriptions). The remaining 20% covers platform costs.' },
      { q: 'When and how do I get paid?', a: 'Request a cash-out from the Creator Center once your balance exceeds $20. Payouts are processed within 3–5 business days via PayPal or Bank Transfer.' },
      { q: 'Can I set different prices for different content?', a: 'Yes. You can set a default subscription price, per-message price, and individual prices on each post you upload.' },
    ],
  },
  {
    label: 'Privacy & Safety',
    faqs: [
      { q: 'What is Ghost Mode?', a: 'Ghost Mode hides your profile from the Nearby discovery tab so you don\'t appear in location-based searches. Toggle it in Settings → Privacy.' },
      { q: 'Can I block another user?', a: 'Yes. Visit the user\'s profile, tap the three-dot menu, and select "Block". Blocked users cannot message you or view your content.' },
      { q: 'How do I report inappropriate content?', a: 'Tap the three-dot menu on any post or profile and select "Report". Our moderation team reviews reports within 24 hours.' },
      { q: 'Who can see my content?', a: 'You control visibility per post (Public, Followers-only, Subscribers-only). Default visibility is set in Settings → Privacy.' },
    ],
  },
  {
    label: 'Messaging',
    faqs: [
      { q: 'Why do messages to creators cost BangCoins?', a: 'Creators charge a per-message fee as part of their monetization. The cost is shown in the conversation banner before you send anything.' },
      { q: 'Are messages to regular users free?', a: 'Yes, messages to non-creator accounts are always free.' },
      { q: 'Can I send photos or videos in messages?', a: 'Yes. Tap the attachment icon in the chat input to send images or videos up to 50 MB.' },
      { q: 'Are my messages private?', a: 'Messages are transmitted over an encrypted connection. Only you and the recipient can read them.' },
    ],
  },
]

const FAQS_COPY = {
  en: {
    title: 'Frequently Asked Questions',
    intro: 'Find quick answers to common questions about BangMe.',
    searchPlaceholder: 'Search FAQs...',
    all: 'All',
    noResults: (search: string) => `No results for "${search}"`,
    contactInstead: 'Contact support instead',
    missing: "Didn't find what you were looking for?",
    contactSupport: 'Contact Support',
    browseHelp: 'Browse Help Center',
    categories,
  },
  de: {
    title: 'Häufig gestellte Fragen',
    intro: 'Finde schnelle Antworten auf häufige Fragen zu BangMe.',
    searchPlaceholder: 'FAQs suchen...',
    all: 'Alle',
    noResults: (search: string) => `Keine Ergebnisse für "${search}"`,
    contactInstead: 'Stattdessen Support kontaktieren',
    missing: 'Nicht gefunden, wonach du gesucht hast?',
    contactSupport: 'Support kontaktieren',
    browseHelp: 'Help Center ansehen',
    categories: [
      {
        label: 'Konto & Registrierung',
        faqs: [
          { q: 'Wie erstelle ich ein Konto?', a: 'Klicke auf der Startseite auf "Registrieren" und gib E-Mail, Benutzername und Passwort ein. Du erhältst eine Bestätigungs-E-Mail zur Aktivierung.' },
          { q: 'Ich habe mein Passwort vergessen. Was tun?', a: 'Klicke auf der Login-Seite auf "Passwort vergessen?" und gib deine E-Mail ein. Wir senden dir einen sicheren Reset-Link, der 1 Stunde gültig ist.' },
          { q: 'Kann ich meinen Benutzernamen ändern?', a: 'Benutzernamen können alle 30 Tage geändert werden. Gehe zu Einstellungen > Profil und aktualisiere das Feld Benutzername.' },
          { q: 'Wie verifiziere ich mein Konto?', a: 'Die Kontoverifizierung ist für Creator mit etablierter Reichweite verfügbar. Bewirb dich im Creator Center.' },
        ],
      },
      {
        label: 'BangCoins & Zahlungen',
        faqs: [
          { q: 'Was sind BangCoins?', a: 'BangCoins sind die In-App-Währung für Nachrichten an Creator, bezahlte Inhalte, Trinkgelder und Audio-/Videoanrufe. 1 BangCoin entspricht ungefähr 1 USD.' },
          { q: 'Wie lade ich BangCoins auf?', a: 'Öffne die BangCoins-Seite in der Seitenleiste, wähle ein Paket oder gib einen Betrag ein und bezahle per Karte über Stripe. Die Coins erscheinen sofort in deinem Guthaben.' },
          { q: 'Sind BangCoins erstattungsfähig?', a: 'BangCoins sind nach dem Kauf nicht erstattungsfähig, außer bei unautorisierter Nutzung. Kontaktiere den Support, wenn dein Konto kompromittiert wurde.' },
          { q: 'Welche Zahlungsmethoden werden unterstützt?', a: 'Wir akzeptieren alle gängigen Kredit- und Debitkarten über Stripe. Google Pay und Apple Pay sind auf unterstützten Geräten verfügbar.' },
        ],
      },
      {
        label: 'Creator',
        faqs: [
          { q: 'Wie werde ich Creator?', a: 'Gehe zu Einstellungen > Creator werden oder nutze den Link in der Seitenleiste. Danach kannst du Abo-Preise festlegen, bezahlte Inhalte hochladen und BangCoins erhalten.' },
          { q: 'Wie funktioniert die 80/20-Umsatzaufteilung?', a: 'Du erhältst 80% aller BangCoins, die für deine Inhalte ausgegeben werden. Die übrigen 20% decken Plattformkosten.' },
          { q: 'Wann und wie werde ich bezahlt?', a: 'Du kannst im Creator Center eine Auszahlung beantragen, sobald dein Guthaben über $20 liegt. Auszahlungen werden innerhalb von 3-5 Werktagen per PayPal oder Banküberweisung verarbeitet.' },
          { q: 'Kann ich unterschiedliche Preise für Inhalte festlegen?', a: 'Ja. Du kannst Standard-Abo-Preise, Preise pro Nachricht und individuelle Preise für jeden hochgeladenen Beitrag festlegen.' },
        ],
      },
      {
        label: 'Datenschutz & Sicherheit',
        faqs: [
          { q: 'Was ist Ghost Mode?', a: 'Ghost Mode verbirgt dein Profil im Nearby-Discovery-Tab, damit du nicht in standortbasierten Suchen erscheinst. Aktiviere ihn unter Einstellungen > Datenschutz.' },
          { q: 'Kann ich andere Nutzer blockieren?', a: 'Ja. Öffne das Profil des Nutzers, tippe auf das Drei-Punkte-Menü und wähle "Blockieren". Blockierte Nutzer können dir nicht schreiben und deine Inhalte nicht sehen.' },
          { q: 'Wie melde ich unangemessene Inhalte?', a: 'Tippe bei einem Beitrag oder Profil auf das Drei-Punkte-Menü und wähle "Melden". Unser Moderationsteam prüft Meldungen innerhalb von 24 Stunden.' },
          { q: 'Wer kann meine Inhalte sehen?', a: 'Du steuerst die Sichtbarkeit pro Beitrag: Öffentlich, nur Follower oder nur Abonnenten. Die Standard-Sichtbarkeit findest du unter Einstellungen > Datenschutz.' },
        ],
      },
      {
        label: 'Nachrichten',
        faqs: [
          { q: 'Warum kosten Nachrichten an Creator BangCoins?', a: 'Creator können als Teil ihrer Monetarisierung eine Gebühr pro Nachricht festlegen. Der Preis wird im Gespräch angezeigt, bevor du etwas sendest.' },
          { q: 'Sind Nachrichten an normale Nutzer kostenlos?', a: 'Ja, Nachrichten an Nicht-Creator-Konten sind immer kostenlos.' },
          { q: 'Kann ich Fotos oder Videos in Nachrichten senden?', a: 'Ja. Tippe im Chat-Eingabefeld auf das Anhang-Symbol, um Bilder oder Videos bis 50 MB zu senden.' },
          { q: 'Sind meine Nachrichten privat?', a: 'Nachrichten werden über eine verschlüsselte Verbindung übertragen. Nur du und der Empfänger können sie lesen.' },
        ],
      },
    ],
  },
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#222] last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="text-white text-sm font-medium">{q}</span>
        {open ? <ChevronUp size={16} className="text-[#ff0618] shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
      </button>
      {open && <p className="text-gray-400 text-sm pb-4 leading-relaxed">{a}</p>}
    </div>
  )
}

export default function FAQsPage() {
  const [search,      setSearch]      = useState('')
  const [activeCategory, setCategory] = useState<string | null>(null)
  const { language } = useI18n()
  const copy = FAQS_COPY[language]

  const filtered = copy.categories.map(c => ({
    ...c,
    faqs: c.faqs.filter(f =>
      !search.trim() ||
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter(c =>
    c.faqs.length > 0 &&
    (!activeCategory || c.label === activeCategory),
  )

  return (
    <div className="min-h-screen bg-brand-dark text-brand-text font-sans">
      {/* Header */}
      <PublicHeader />

      {/* Hero */}
      <section className="pt-16 pb-10 text-center px-4 bg-gradient-to-b from-[#1a0000] to-brand-dark">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">{copy.title}</h1>
        <p className="text-brand-muted mb-8 max-w-xl mx-auto">{copy.intro}</p>
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

      <main className="max-w-4xl mx-auto px-4 pb-20">
        {/* Category filter pills */}
        {!search && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${!activeCategory ? 'bg-[#ff0618] text-white' : 'bg-[#1e1e1e] text-gray-400 hover:text-white border border-[#333]'}`}
            >
              {copy.all}
            </button>
            {copy.categories.map(c => (
              <button
                key={c.label}
                onClick={() => setCategory(c.label === activeCategory ? null : c.label)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${activeCategory === c.label ? 'bg-[#ff0618] text-white' : 'bg-[#1e1e1e] text-gray-400 hover:text-white border border-[#333]'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* FAQ accordion */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">{copy.noResults(search)}</p>
            <Link href="/contact" className="mt-4 inline-block text-[#ff0618] hover:underline text-sm">
              {copy.contactInstead}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.map(cat => (
              <div key={cat.label} className="bg-[#161616] border border-[#222] rounded-2xl px-6 py-2">
                <h2 className="text-white font-bold text-base py-4 border-b border-[#222]">{cat.label}</h2>
                {cat.faqs.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
              </div>
            ))}
          </div>
        )}

        {/* Still need help */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 text-sm mb-4">{copy.missing}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contact" className="bg-[#ff0618] hover:bg-red-500 text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm">
              {copy.contactSupport}
            </Link>
            <Link href="/help" className="bg-[#222] hover:bg-[#333] text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm">
              {copy.browseHelp}
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
