'use client'

import Link from 'next/link'
import { Shield, AlertTriangle, Heart, Ban, FileText, Eye, type LucideIcon } from 'lucide-react'
import { useI18n, type Language } from '@/lib/i18n'

type Section = {
  icon: LucideIcon
  title: string
  color: string
  bg: string
  rules: string[]
}

const sectionsEn: Section[] = [
  { icon: Heart, title: 'Respect & Kindness', color: 'text-pink-400', bg: 'bg-pink-400/10', rules: ['Treat all users with dignity and respect.', 'Do not harass, bully, or intimidate others in messages, comments, or live streams.', 'Hate speech based on race, gender, sexuality, religion, disability, or nationality is strictly prohibited.', 'Constructive criticism is welcome; personal attacks are not.'] },
  { icon: Shield, title: 'Safety & Privacy', color: 'text-blue-400', bg: 'bg-blue-400/10', rules: ['Do not share personal information of yourself or others.', 'Do not dox, stalk, or attempt to track other users.', 'Report any content that threatens physical harm.', 'Impersonating another person or brand is not permitted.'] },
  { icon: Eye, title: 'Content Standards', color: 'text-purple-400', bg: 'bg-purple-400/10', rules: ['All users must be 18 years or older to create an account.', 'Adult content is permitted only for verified creators on paid tiers, with proper age gating.', 'Content depicting minors in a sexual context is strictly forbidden and will be reported to authorities.', 'Non-consensual intimate imagery is prohibited and will be removed immediately.'] },
  { icon: Ban, title: 'Prohibited Activities', color: 'text-red-400', bg: 'bg-red-400/10', rules: ['Do not distribute malware, phishing links, or attempt to hack accounts.', 'Spam, unsolicited advertising, and bot activity are not allowed.', 'Do not manipulate platform features such as fake engagement or bot subscriptions.', 'Selling or buying accounts, follows, or subscribers is prohibited.'] },
  { icon: AlertTriangle, title: 'Misinformation & Harmful Content', color: 'text-yellow-400', bg: 'bg-yellow-400/10', rules: ['Do not spread demonstrably false information that could cause real-world harm.', 'Content that glorifies or promotes violence, self-harm, or suicide is not permitted.', 'Do not post content that violates copyright or other intellectual property rights.', 'Coordinated inauthentic behavior and influence operations are banned.'] },
  { icon: FileText, title: 'Enforcement', color: 'text-green-400', bg: 'bg-green-400/10', rules: ['Violations may result in a warning, content removal, account suspension, or permanent ban depending on severity.', 'Serious violations result in an immediate permanent ban and may be reported to law enforcement.', 'You may appeal enforcement decisions by contacting support within 14 days.', 'BangMe reserves the right to update these guidelines at any time. Continued use constitutes acceptance.'] },
]

const sectionsDe: Section[] = [
  { icon: Heart, title: 'Respekt & Freundlichkeit', color: 'text-pink-400', bg: 'bg-pink-400/10', rules: ['Behandle alle Nutzer mit Würde und Respekt.', 'Belästigung, Mobbing oder Einschüchterung in Nachrichten, Kommentaren oder Livestreams ist verboten.', 'Hassrede aufgrund von Herkunft, Geschlecht, Sexualität, Religion, Behinderung oder Nationalität ist streng untersagt.', 'Konstruktive Kritik ist willkommen; persönliche Angriffe nicht.'] },
  { icon: Shield, title: 'Sicherheit & Datenschutz', color: 'text-blue-400', bg: 'bg-blue-400/10', rules: ['Teile keine persönlichen Informationen von dir oder anderen.', 'Doxxing, Stalking oder das Verfolgen anderer Nutzer ist verboten.', 'Melde Inhalte, die körperlichen Schaden androhen.', 'Das Ausgeben als andere Person oder Marke ist nicht erlaubt.'] },
  { icon: Eye, title: 'Inhaltsstandards', color: 'text-purple-400', bg: 'bg-purple-400/10', rules: ['Alle Nutzer müssen mindestens 18 Jahre alt sein.', 'Erwachsenen-Inhalte sind nur für verifizierte Creator in bezahlten Bereichen mit Altersprüfung erlaubt.', 'Inhalte mit Minderjährigen in sexuellem Kontext sind streng verboten und werden Behörden gemeldet.', 'Nicht einvernehmliche intime Bilder sind verboten und werden sofort entfernt.'] },
  { icon: Ban, title: 'Verbotene Aktivitäten', color: 'text-red-400', bg: 'bg-red-400/10', rules: ['Verteile keine Malware oder Phishing-Links und versuche nicht, Konten zu hacken.', 'Spam, unerwünschte Werbung und Bot-Aktivität sind nicht erlaubt.', 'Manipuliere keine Plattformfunktionen wie Engagement oder Abonnements.', 'Der Kauf oder Verkauf von Konten, Follows oder Abonnenten ist verboten.'] },
  { icon: AlertTriangle, title: 'Fehlinformationen & schädliche Inhalte', color: 'text-yellow-400', bg: 'bg-yellow-400/10', rules: ['Verbreite keine nachweislich falschen Informationen, die realen Schaden verursachen können.', 'Inhalte, die Gewalt, Selbstverletzung oder Suizid verherrlichen oder fördern, sind nicht erlaubt.', 'Poste keine Inhalte, die Urheberrechte oder andere Schutzrechte verletzen.', 'Koordiniertes unauthentisches Verhalten und Einflusskampagnen sind verboten.'] },
  { icon: FileText, title: 'Durchsetzung', color: 'text-green-400', bg: 'bg-green-400/10', rules: ['Verstöße können je nach Schwere zu Warnung, Entfernung von Inhalten, Sperrung oder dauerhaftem Ausschluss führen.', 'Schwere Verstöße führen zu sofortigem dauerhaftem Ausschluss und können Strafverfolgungsbehörden gemeldet werden.', 'Du kannst Durchsetzungsentscheidungen innerhalb von 14 Tagen beim Support anfechten.', 'BangMe kann diese Richtlinien jederzeit aktualisieren. Die weitere Nutzung gilt als Zustimmung.'] },
]

const copy = {
  en: { title: 'Community Guidelines', intro: <>Last updated: <span className="text-white">July 1, 2026</span>. These guidelines apply to all users and content on BangMe.</>, body: 'BangMe is a platform built on the principles of creative freedom and mutual respect. Our Community Guidelines exist to protect all users and ensure BangMe remains a safe, welcoming space. Breaking these rules may result in content removal, suspension, or a permanent ban.', agree: 'By using BangMe you agree to these guidelines as well as our', terms: 'Terms of Service', privacy: 'Privacy Policy', report: 'Report a Violation', contact: 'Contact Us', sections: sectionsEn },
  de: { title: 'Community-Richtlinien', intro: <>Zuletzt aktualisiert: <span className="text-white">1. Juli 2026</span>. Diese Richtlinien gelten für alle Nutzer und Inhalte auf BangMe.</>, body: 'BangMe basiert auf kreativer Freiheit und gegenseitigem Respekt. Unsere Community-Richtlinien schützen alle Nutzer und sorgen dafür, dass BangMe ein sicherer und einladender Ort bleibt. Verstöße können zur Entfernung von Inhalten, Sperrung oder dauerhaftem Ausschluss führen.', agree: 'Mit der Nutzung von BangMe stimmst du diesen Richtlinien sowie unseren', terms: 'Nutzungsbedingungen', privacy: 'Datenschutzerklärung', report: 'Verstoß melden', contact: 'Kontakt', sections: sectionsDe },
} satisfies Record<Language, { title: string; intro: React.ReactNode; body: string; agree: string; terms: string; privacy: string; report: string; contact: string; sections: Section[] }>

export function CommunityGuidelinesContent() {
  const { language } = useI18n()
  const text = copy[language]

  return (
    <>
      <section className="pt-16 pb-8 text-center px-4 bg-gradient-to-b from-[#1a0000] to-brand-dark">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">{text.title}</h1>
        <p className="text-brand-muted text-base max-w-2xl mx-auto">{text.intro}</p>
      </section>

      <main className="max-w-3xl mx-auto px-4 pb-20 space-y-8">
        <div className="bg-[#161616] border border-[#222] rounded-2xl p-6 text-gray-300 text-sm leading-relaxed">
          {text.body}
        </div>

        {text.sections.map(section => {
          const Icon = section.icon
          return (
            <div key={section.title} className="bg-[#161616] border border-[#222] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-9 h-9 rounded-lg ${section.bg} flex items-center justify-center`}>
                  <Icon size={18} className={section.color} />
                </div>
                <h2 className="text-white font-bold text-lg">{section.title}</h2>
              </div>
              <ul className="space-y-2.5">
                {section.rules.map(rule => (
                  <li key={rule} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${section.bg.replace('/10', '')} shrink-0`} />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}

        <div className="bg-[#161616] border border-[#222] rounded-2xl p-6 text-center">
          <p className="text-gray-400 text-sm mb-4">
            {text.agree}{' '}
            <Link href="/terms-of-service" className="text-[#ff0618] hover:underline">{text.terms}</Link> and{' '}
            <Link href="/privacy-policy" className="text-[#ff0618] hover:underline">{text.privacy}</Link>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/report-issue" className="bg-[#ff0618] hover:bg-red-500 text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm">{text.report}</Link>
            <Link href="/contact" className="bg-[#222] hover:bg-[#333] text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm">{text.contact}</Link>
          </div>
        </div>
      </main>
    </>
  )
}