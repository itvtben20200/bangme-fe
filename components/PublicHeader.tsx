'use client'

import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { LanguageSelector } from '@/components/LanguageSelector'
import { useI18n } from '@/lib/i18n'

export function PublicHeader() {
  const { t } = useI18n()

  return (
    <header className="border-b border-brand-border bg-brand-surface/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <BrandLogo href="/" imageClassName="h-6 md:h-7 w-auto max-w-[130px]" />
        <nav className="flex items-center gap-3 text-sm">
          <LanguageSelector compact />
          <Link href="/login" className="hidden sm:inline text-brand-muted hover:text-white transition-colors">{t('landing.login')}</Link>
          <Link href="/register" className="bg-brand-red hover:bg-red-600 transition-colors text-white px-4 py-1.5 rounded-full font-semibold">
            {t('common.signUp')}
          </Link>
        </nav>
      </div>
    </header>
  )
}