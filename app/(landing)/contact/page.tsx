'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, MessageCircle, Phone, Send, CheckCircle } from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { useI18n } from '@/lib/i18n'

const CONTACT_METHODS = [
  {
    icon: Mail,
    title: 'Email Support',
    detail: 'support@bangme.com',
    note: 'Response within 24 hours',
  },
  {
    icon: MessageCircle,
    title: 'Live Chat',
    detail: 'Available 24/7',
    note: 'Instant support for urgent issues',
  },
  {
    icon: Phone,
    title: 'Phone Support',
    detail: '+1 (555) 123-4567',
    note: 'Mon–Fri, 9 AM–6 PM EST',
  },
]

const FAQS = [
  {
    q: 'How do I reset my password?',
    a: 'Click "Forgot Password" on the login page and follow the instructions sent to your email.',
  },
  {
    q: 'How do I become a creator?',
    a: 'Visit the "Become a Creator" page to learn about the application process and requirements.',
  },
  {
    q: 'How do I report inappropriate content?',
    a: 'Use the report button on any content that violates our Community Guidelines.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept major credit cards, PayPal, Apple Pay, Google Pay, and bank transfers.',
  },
]

const SUBJECTS = [
  { value: '', label: 'Select a topic' },
  { value: 'general', label: 'General Inquiry' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'billing', label: 'Billing & Payments' },
  { value: 'account', label: 'Account Issues' },
  { value: 'content', label: 'Content & Moderation' },
  { value: 'partnership', label: 'Partnership Opportunities' },
  { value: 'legal', label: 'Legal Matters' },
  { value: 'other', label: 'Other' },
]

const CONTACT_COPY = {
  en: {
    title: 'Contact Us',
    intro: "We're here to help. Reach out to our support team and we'll get back to you as soon as possible.",
    methods: CONTACT_METHODS,
    formTitle: 'Send us a Message',
    successTitle: 'Message Sent!',
    successBody: "Thanks for reaching out. We'll get back to you within 24 hours.",
    sendAnother: 'Send another message',
    nameLabel: 'Full Name',
    namePlaceholder: 'Jane Doe',
    emailLabel: 'Email Address',
    emailPlaceholder: 'jane@example.com',
    subjectLabel: 'Subject',
    messageLabel: 'Message',
    messagePlaceholder: 'Please describe your issue or inquiry in detail...',
    sendMessage: 'Send Message',
    responseTitle: 'Response Times',
    responseTimes: [
      ['General inquiries', '24 hours'],
      ['Technical issues', '12 hours'],
      ['Billing support', '6 hours'],
      ['Urgent / safety', '2 hours'],
    ],
    resourcesTitle: 'Other Resources',
    resources: ['Help Center', 'FAQs', 'Community Guidelines', 'Report an Issue'],
    faqTitle: 'Frequently Asked Questions',
    faqs: FAQS,
    footer: '© 2025 BangMe. All rights reserved.',
    footerLinks: ['Terms', 'Privacy', 'Guidelines'],
    subjects: SUBJECTS,
    errors: {
      name: 'Name is required.',
      email: 'Email is required.',
      invalidEmail: 'Enter a valid email.',
      subject: 'Please select a topic.',
      message: 'Message is required.',
    },
  },
  de: {
    title: 'Kontakt',
    intro: 'Wir helfen dir gern. Kontaktiere unser Support-Team, und wir melden uns so schnell wie möglich zurück.',
    methods: [
      { icon: Mail, title: 'E-Mail-Support', detail: 'support@bangme.com', note: 'Antwort innerhalb von 24 Stunden' },
      { icon: MessageCircle, title: 'Live-Chat', detail: 'Rund um die Uhr verfügbar', note: 'Sofortige Hilfe bei dringenden Anliegen' },
      { icon: Phone, title: 'Telefon-Support', detail: '+1 (555) 123-4567', note: 'Mo-Fr, 9-18 Uhr EST' },
    ],
    formTitle: 'Sende uns eine Nachricht',
    successTitle: 'Nachricht gesendet!',
    successBody: 'Danke für deine Nachricht. Wir melden uns innerhalb von 24 Stunden zurück.',
    sendAnother: 'Weitere Nachricht senden',
    nameLabel: 'Vollständiger Name',
    namePlaceholder: 'Jane Doe',
    emailLabel: 'E-Mail-Adresse',
    emailPlaceholder: 'jane@example.com',
    subjectLabel: 'Betreff',
    messageLabel: 'Nachricht',
    messagePlaceholder: 'Beschreibe dein Anliegen bitte möglichst genau...',
    sendMessage: 'Nachricht senden',
    responseTitle: 'Antwortzeiten',
    responseTimes: [
      ['Allgemeine Anfragen', '24 Stunden'],
      ['Technische Probleme', '12 Stunden'],
      ['Zahlungssupport', '6 Stunden'],
      ['Dringend / Sicherheit', '2 Stunden'],
    ],
    resourcesTitle: 'Weitere Ressourcen',
    resources: ['Help Center', 'FAQs', 'Community-Richtlinien', 'Problem melden'],
    faqTitle: 'Häufig gestellte Fragen',
    faqs: [
      { q: 'Wie setze ich mein Passwort zurück?', a: 'Klicke auf der Login-Seite auf "Passwort vergessen" und folge den Anweisungen in der E-Mail.' },
      { q: 'Wie werde ich Creator?', a: 'Besuche die Seite "Creator werden", um mehr über den Bewerbungsprozess und die Anforderungen zu erfahren.' },
      { q: 'Wie melde ich unangemessene Inhalte?', a: 'Nutze den Melden-Button bei Inhalten, die gegen unsere Community-Richtlinien verstoßen.' },
      { q: 'Welche Zahlungsmethoden akzeptiert ihr?', a: 'Wir akzeptieren gängige Kreditkarten, PayPal, Apple Pay, Google Pay und Banküberweisungen.' },
    ],
    footer: '© 2025 BangMe. Alle Rechte vorbehalten.',
    footerLinks: ['Bedingungen', 'Datenschutz', 'Richtlinien'],
    subjects: [
      { value: '', label: 'Thema auswählen' },
      { value: 'general', label: 'Allgemeine Anfrage' },
      { value: 'technical', label: 'Technischer Support' },
      { value: 'billing', label: 'Abrechnung & Zahlungen' },
      { value: 'account', label: 'Kontoprobleme' },
      { value: 'content', label: 'Inhalte & Moderation' },
      { value: 'partnership', label: 'Partnerschaften' },
      { value: 'legal', label: 'Rechtliches' },
      { value: 'other', label: 'Sonstiges' },
    ],
    errors: {
      name: 'Name ist erforderlich.',
      email: 'E-Mail ist erforderlich.',
      invalidEmail: 'Gib eine gültige E-Mail ein.',
      subject: 'Bitte wähle ein Thema aus.',
      message: 'Nachricht ist erforderlich.',
    },
  },
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const { language } = useI18n()
  const copy = CONTACT_COPY[language]

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = copy.errors.name
    if (!form.email.trim()) e.email = copy.errors.email
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = copy.errors.invalidEmail
    if (!form.subject) e.subject = copy.errors.subject
    if (!form.message.trim()) e.message = copy.errors.message
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    // Simulate network request
    await new Promise((r) => setTimeout(r, 900))
    setLoading(false)
    setSubmitted(true)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setErrors((err) => ({ ...err, [e.target.name]: '' }))
  }

  return (
    <div className="min-h-screen bg-brand-dark text-brand-text font-sans">
      {/* ── Header ── */}
      <PublicHeader />

      {/* ── Hero ── */}
      <section className="pt-16 pb-10 text-center px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">{copy.title}</h1>
        <p className="text-brand-muted text-lg max-w-xl mx-auto">
          {copy.intro}
        </p>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-20">
        {/* ── Contact methods ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
          {copy.methods.map(({ icon: Icon, title, detail, note }) => (
            <div
              key={title}
              className="bg-brand-card border border-brand-border rounded-2xl p-5 flex flex-col gap-3 hover:border-brand-red/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-brand-red" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-brand-text text-sm mt-0.5">{detail}</p>
                <p className="text-brand-muted text-xs mt-1">{note}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Form + Sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-16">
          {/* Form */}
          <div className="lg:col-span-3 bg-brand-card border border-brand-border rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">{copy.formTitle}</h2>

            {submitted ? (
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <CheckCircle className="w-14 h-14 text-brand-red" />
                <h3 className="text-xl font-bold text-white">{copy.successTitle}</h3>
                <p className="text-brand-muted max-w-sm">
                  {copy.successBody}
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                  className="mt-2 text-brand-red hover:underline text-sm font-medium"
                >
                  {copy.sendAnother}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-brand-text mb-1.5">
                    {copy.nameLabel} <span className="text-brand-red">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder={copy.namePlaceholder}
                    className={`w-full bg-brand-surface border rounded-xl px-4 py-2.5 text-white placeholder-brand-muted/60 outline-none focus:ring-2 focus:ring-brand-red/50 transition ${errors.name ? 'border-red-500' : 'border-brand-border'}`}
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-brand-text mb-1.5">
                    {copy.emailLabel} <span className="text-brand-red">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder={copy.emailPlaceholder}
                    className={`w-full bg-brand-surface border rounded-xl px-4 py-2.5 text-white placeholder-brand-muted/60 outline-none focus:ring-2 focus:ring-brand-red/50 transition ${errors.email ? 'border-red-500' : 'border-brand-border'}`}
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-brand-text mb-1.5">
                    {copy.subjectLabel} <span className="text-brand-red">*</span>
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className={`w-full bg-brand-surface border rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-brand-red/50 transition ${errors.subject ? 'border-red-500' : 'border-brand-border'}`}
                  >
                    {copy.subjects.map(({ value, label }) => (
                      <option key={value} value={value} disabled={value === ''} className="bg-brand-dark">
                        {label}
                      </option>
                    ))}
                  </select>
                  {errors.subject && <p className="text-red-400 text-xs mt-1">{errors.subject}</p>}
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-brand-text mb-1.5">
                    {copy.messageLabel} <span className="text-brand-red">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={form.message}
                    onChange={handleChange}
                    placeholder={copy.messagePlaceholder}
                    className={`w-full bg-brand-surface border rounded-xl px-4 py-2.5 text-white placeholder-brand-muted/60 outline-none focus:ring-2 focus:ring-brand-red/50 transition resize-none ${errors.message ? 'border-red-500' : 'border-brand-border'}`}
                  />
                  {errors.message && <p className="text-red-400 text-xs mt-1">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-red hover:bg-red-600 disabled:opacity-60 text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {copy.sendMessage}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Sidebar info */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-2">{copy.responseTitle}</h3>
              <ul className="space-y-2 text-sm text-brand-muted">
                {copy.responseTimes.map(([label, time], index) => (
                  <li key={label} className="flex justify-between"><span>{label}</span><span className={index === 3 ? 'text-brand-red font-medium' : 'text-brand-text'}>{time}</span></li>
                ))}
              </ul>
            </div>

            <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-3">{copy.resourcesTitle}</h3>
              <div className="flex flex-col gap-2 text-sm">
                <Link href="/help" className="text-brand-muted hover:text-white transition-colors">{copy.resources[0]} {'->'}</Link>
                <Link href="/faqs" className="text-brand-muted hover:text-white transition-colors">{copy.resources[1]} {'->'}</Link>
                <Link href="/community-guidelines" className="text-brand-muted hover:text-white transition-colors">{copy.resources[2]} {'->'}</Link>
                <Link href="/report-issue" className="text-brand-muted hover:text-white transition-colors">{copy.resources[3]} {'->'}</Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 text-center">{copy.faqTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {copy.faqs.map(({ q, a }) => (
              <div key={q} className="bg-brand-card border border-brand-border rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-2 text-sm">{q}</h3>
                <p className="text-brand-muted text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-brand-border bg-brand-surface">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-brand-muted">
          <span>{copy.footer}</span>
          <div className="flex gap-5">
            <Link href="/terms-of-service" className="hover:text-white transition-colors">{copy.footerLinks[0]}</Link>
            <Link href="/privacy-policy" className="hover:text-white transition-colors">{copy.footerLinks[1]}</Link>
            <Link href="/community-guidelines" className="hover:text-white transition-colors">{copy.footerLinks[2]}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
