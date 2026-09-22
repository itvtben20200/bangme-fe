'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

type LegalSection = { title: string; body: string }

type LegalPageContentProps = {
  kind: 'privacy' | 'terms'
  sections: { en: LegalSection[]; de: LegalSection[] }
}

const copy = {
  en: {
    privacy: {
      title: 'Privacy Policy',
      intro: <>Last updated: <span className="text-white">June 8, 2026</span>. Your privacy matters to us, here is how we handle your data.</>,
      links: ['Terms of Service ->', 'Contact Us ->'],
      footer: 'All rights reserved.',
    },
    terms: {
      title: 'Terms of Service',
      intro: <>Last updated: <span className="text-white">June 8, 2026</span>. Please read these terms carefully before using BangMe.</>,
      links: ['Privacy Policy ->', 'Contact Us ->'],
      footer: 'All rights reserved.',
    },
  },
  de: {
    privacy: {
      title: 'Datenschutzerklärung',
      intro: <>Zuletzt aktualisiert: <span className="text-white">8. Juni 2026</span>. Deine Privatsphäre ist uns wichtig, so gehen wir mit deinen Daten um.</>,
      links: ['Nutzungsbedingungen ->', 'Kontakt ->'],
      footer: 'Alle Rechte vorbehalten.',
    },
    terms: {
      title: 'Nutzungsbedingungen',
      intro: <>Zuletzt aktualisiert: <span className="text-white">8. Juni 2026</span>. Bitte lies diese Bedingungen sorgfältig, bevor du BangMe nutzt.</>,
      links: ['Datenschutzerklärung ->', 'Kontakt ->'],
      footer: 'Alle Rechte vorbehalten.',
    },
  },
}

export function LegalPageContent({ kind, sections }: LegalPageContentProps) {
  const { language } = useI18n()
  const pageCopy = copy[language][kind]
  const currentSections = sections[language]
  const relatedHref = kind === 'privacy' ? '/terms-of-service' : '/privacy-policy'

  return (
    <>
      <section className="pt-16 pb-8 text-center px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">{pageCopy.title}</h1>
        <p className="text-brand-muted text-base max-w-2xl mx-auto">{pageCopy.intro}</p>
      </section>

      <main className="max-w-3xl mx-auto px-4 pb-20 space-y-10">
        {currentSections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-bold text-white mb-2">{section.title}</h2>
            <p className="text-brand-muted leading-relaxed text-sm">{section.body}</p>
          </section>
        ))}

        <div className="border-t border-brand-border pt-8 flex flex-col sm:flex-row gap-3 text-sm">
          <Link href={relatedHref} className="text-brand-red hover:underline">{pageCopy.links[0]}</Link>
          <Link href="/contact" className="text-brand-red hover:underline">{pageCopy.links[1]}</Link>
        </div>
      </main>

      <footer className="border-t border-brand-border py-6 text-center text-brand-muted text-xs">
        © {new Date().getFullYear()} BangMe, Inc. {pageCopy.footer}
      </footer>
    </>
  )
}