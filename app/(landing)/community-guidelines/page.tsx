import { PublicHeader } from '@/components/PublicHeader'
import { CommunityGuidelinesContent } from '@/components/CommunityGuidelinesContent'

export const metadata = {
  title: 'Community Guidelines – BangMe',
  description: 'Read the BangMe Community Guidelines to understand what is and is not allowed on our platform.',
}

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-brand-dark text-brand-text font-sans">
      {/* Header */}
      <PublicHeader />

      <CommunityGuidelinesContent />
    </div>
  )
}
