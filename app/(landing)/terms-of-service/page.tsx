import { TERMS_SECTIONS, TERMS_SECTIONS_DE } from '@/lib/legal-content'
import { PublicHeader } from '@/components/PublicHeader'
import { LegalPageContent } from '@/components/LegalPageContent'

export const metadata = {
  title: 'Terms of Service – BangMe',
  description: 'Read the BangMe Terms of Service before using our platform.',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-brand-dark text-brand-text font-sans">
      {/* Header */}
      <PublicHeader />
      <LegalPageContent kind="terms" sections={{ en: TERMS_SECTIONS, de: TERMS_SECTIONS_DE }} />
    </div>
  )
}
