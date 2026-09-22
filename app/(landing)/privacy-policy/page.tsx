import { PRIVACY_SECTIONS, PRIVACY_SECTIONS_DE } from '@/lib/legal-content'
import { PublicHeader } from '@/components/PublicHeader'
import { LegalPageContent } from '@/components/LegalPageContent'

export const metadata = {
  title: 'Privacy Policy – BangMe',
  description: 'Learn how BangMe collects, uses, and protects your personal information.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-brand-dark text-brand-text font-sans">
      {/* Header */}
      <PublicHeader />
      <LegalPageContent kind="privacy" sections={{ en: PRIVACY_SECTIONS, de: PRIVACY_SECTIONS_DE }} />
    </div>
  )
}
