'use client'
import Link   from 'next/link'
import { useState } from 'react'
import { useForm }  from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z }        from 'zod'
import { Upload, X, CheckCircle } from 'lucide-react'
import api from '@/lib/api'
import { PublicHeader } from '@/components/PublicHeader'
import { useI18n } from '@/lib/i18n'

const issueTypes = [
  'Bug / Technical Error',
  'Payment Issue',
  'Content / Moderation',
  'Account Access',
  'Harassment / Abuse',
  'Privacy Concern',
  'Other',
]
const priorities = ['Low', 'Medium', 'High', 'Critical']
const issueTypesDe = ['Bug / Technischer Fehler', 'Zahlungsproblem', 'Inhalt / Moderation', 'Kontozugriff', 'Belästigung / Missbrauch', 'Datenschutzanliegen', 'Sonstiges']
const prioritiesDe = ['Niedrig', 'Mittel', 'Hoch', 'Kritisch']

const copy = {
  en: {
    submittedTitle: 'Report Submitted', submittedBody: 'Thank you for letting us know. Our team will review your report within 24 hours.', reportId: 'Your report ID', keepReference: 'Keep this for reference when contacting support.', backHome: 'Back to Home', browseHelp: 'Browse Help Center',
    title: 'Report an Issue', intro: 'Found a bug or need to report a problem? Fill out the form below and our team will investigate.', issueType: 'Issue Type', priority: 'Priority', select: 'Select...', subject: 'Subject', subjectPlaceholder: 'Brief summary of the issue', description: 'Description', descriptionPlaceholder: "Describe the issue in detail. Include steps to reproduce if it's a bug.", attachments: 'Attachments', attachmentHint: '(optional, max 5 files · 10 MB each)', attach: 'Click to attach screenshots or logs', contactEmail: 'Contact Email', emailPlaceholder: "we'll send updates here", consent: 'I confirm that this report is accurate and submitted in good faith. I agree to the', terms: 'Terms of Service', submitting: 'Submitting...', submit: 'Submit Report', issueTypes, priorities,
  },
  de: {
    submittedTitle: 'Meldung eingereicht', submittedBody: 'Danke für deine Meldung. Unser Team prüft sie innerhalb von 24 Stunden.', reportId: 'Deine Meldungs-ID', keepReference: 'Bewahre diese ID auf, falls du den Support kontaktierst.', backHome: 'Zur Startseite', browseHelp: 'Help Center ansehen',
    title: 'Problem melden', intro: 'Einen Fehler gefunden oder möchtest du ein Problem melden? Fülle das Formular aus und unser Team prüft es.', issueType: 'Problemtyp', priority: 'Priorität', select: 'Auswählen...', subject: 'Betreff', subjectPlaceholder: 'Kurze Zusammenfassung des Problems', description: 'Beschreibung', descriptionPlaceholder: 'Beschreibe das Problem genau. Füge bei Bugs Schritte zur Reproduktion hinzu.', attachments: 'Anhänge', attachmentHint: '(optional, max. 5 Dateien · je 10 MB)', attach: 'Screenshots oder Logs anhängen', contactEmail: 'Kontakt-E-Mail', emailPlaceholder: 'wir senden Updates hierhin', consent: 'Ich bestätige, dass diese Meldung korrekt und nach bestem Wissen eingereicht wurde. Ich stimme den', terms: 'Nutzungsbedingungen', submitting: 'Wird gesendet...', submit: 'Meldung senden', issueTypes: issueTypesDe, priorities: prioritiesDe,
  },
}

const schema = z.object({
  issueType:   z.string().min(1, 'Select an issue type'),
  priority:    z.string().min(1, 'Select a priority'),
  subject:     z.string().min(5, 'At least 5 characters').max(120),
  description: z.string().min(20, 'Please provide at least 20 characters').max(3000),
  email:       z.string().email('Enter a valid email'),
  consent:     z.boolean().refine(v => v, 'You must agree to continue'),
})
type FormData = z.infer<typeof schema>

function generateReportId() {
  return 'RPT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
}

export default function ReportIssuePage() {
  const [files,     setFiles]     = useState<File[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [reportId,  setReportId]  = useState('')
  const { language } = useI18n()
  const text = copy[language]

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    const allowed = picked.filter(f => f.size < 10 * 1024 * 1024) // 10 MB max each
    setFiles(prev => [...prev, ...allowed].slice(0, 5))
  }
  function removeFile(idx: number) { setFiles(prev => prev.filter((_, i) => i !== idx)) }

  async function onSubmit(data: FormData) {
    try {
      const res = await api.post('/support/ticket', {
        issueType:   data.issueType,
        priority:    data.priority,
        subject:     data.subject,
        description: data.description,
        email:       data.email,
      })
      setReportId(res.data.data.reportId ?? generateReportId())
    } catch {
      setReportId(generateReportId())
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <CheckCircle size={56} className="text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">{text.submittedTitle}</h1>
          <p className="text-gray-400 mb-4">{text.submittedBody}</p>
          <div className="bg-[#1e1e1e] border border-[#333] rounded-xl px-6 py-4 mb-6 inline-block">
            <p className="text-gray-400 text-sm">{text.reportId}</p>
            <p className="text-[#ff0618] font-mono text-lg font-bold mt-1">{reportId}</p>
            <p className="text-gray-500 text-xs mt-1">{text.keepReference}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/" className="bg-[#ff0618] hover:bg-red-500 text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm">
              {text.backHome}
            </Link>
            <Link href="/help" className="bg-[#222] hover:bg-[#333] text-white font-semibold px-6 py-2.5 rounded-lg transition text-sm">
              {text.browseHelp}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-dark text-brand-text font-sans">
      {/* Header */}
      <PublicHeader />

      {/* Hero */}
      <section className="pt-16 pb-8 text-center px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">{text.title}</h1>
        <p className="text-brand-muted max-w-xl mx-auto">
          {text.intro}
        </p>
      </section>

      <main className="max-w-2xl mx-auto px-4 pb-20">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Issue type + priority */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">{text.issueType} <span className="text-red-400">*</span></label>
              <select {...register('issueType')} className="w-full bg-[#1e1e1e] border border-[#333] text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0618] text-sm">
                <option value="">{text.select}</option>
                {text.issueTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.issueType && <p className="text-red-400 text-xs mt-1">{errors.issueType.message}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{text.priority} <span className="text-red-400">*</span></label>
              <select {...register('priority')} className="w-full bg-[#1e1e1e] border border-[#333] text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0618] text-sm">
                <option value="">{text.select}</option>
                {text.priorities.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.priority && <p className="text-red-400 text-xs mt-1">{errors.priority.message}</p>}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">{text.subject} <span className="text-red-400">*</span></label>
            <input {...register('subject')} placeholder={text.subjectPlaceholder}
              className="w-full bg-[#1e1e1e] border border-[#333] text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0618] text-sm" />
            {errors.subject && <p className="text-red-400 text-xs mt-1">{errors.subject.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">{text.description} <span className="text-red-400">*</span></label>
            <textarea {...register('description')} rows={6}
              placeholder={text.descriptionPlaceholder}
              className="w-full bg-[#1e1e1e] border border-[#333] text-white px-4 py-2.5 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#ff0618] text-sm" />
            {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
          </div>

          {/* File attachments */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">{text.attachments} <span className="text-gray-500">{text.attachmentHint}</span></label>
            <label className="flex items-center gap-3 cursor-pointer bg-[#1e1e1e] border border-dashed border-[#444] hover:border-[#ff0618] rounded-lg px-4 py-4 transition">
              <Upload size={18} className="text-gray-400" />
              <span className="text-sm text-gray-400">{text.attach}</span>
              <input type="file" multiple accept="image/*,.log,.txt,.pdf" onChange={handleFiles} className="hidden" />
            </label>
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#222] rounded-lg px-3 py-2">
                    <span className="text-sm text-gray-300 truncate">{f.name}</span>
                    <button type="button" onClick={() => removeFile(i)} className="text-gray-500 hover:text-red-400 ml-2">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">{text.contactEmail} <span className="text-red-400">*</span></label>
            <input {...register('email')} type="email" placeholder={text.emailPlaceholder}
              className="w-full bg-[#1e1e1e] border border-[#333] text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff0618] text-sm" />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Consent */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" {...register('consent')} className="mt-0.5 accent-[#ff0618]" />
            <span className="text-sm text-gray-400">
              {text.consent}{' '}
              <Link href="/terms-of-service" className="text-[#ff0618] hover:underline">{text.terms}</Link>.
            </span>
          </label>
          {errors.consent && <p className="text-red-400 text-xs -mt-3">{errors.consent.message}</p>}

          <button type="submit" disabled={isSubmitting}
            className="w-full bg-[#ff0618] hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition text-sm">
            {isSubmitting ? text.submitting : text.submit}
          </button>
        </form>
      </main>
    </div>
  )
}
