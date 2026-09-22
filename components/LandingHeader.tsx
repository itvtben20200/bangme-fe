'use client'

import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { LanguageSelector } from '@/components/LanguageSelector'
import { useI18n } from '@/lib/i18n'

export function LandingHeader() {
  const { t } = useI18n()

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-4 px-6 md:px-12 py-4 bg-brand-dark/80 backdrop-blur-md border-b border-brand-border">
      <BrandLogo href="/" imageClassName="h-6 md:h-7 w-auto max-w-[130px]" priority />
      <nav className="hidden md:flex items-center gap-8 text-sm text-brand-muted">
        <Link href="/explore"      className="hover:text-white transition">{t('landing.explore')}</Link>
        <a href="#creators"        className="hover:text-white transition">{t('landing.creators')}</a>
        <a href="#categories"      className="hover:text-white transition">{t('landing.categories')}</a>
        <a href="#how-it-works"    className="hover:text-white transition">{t('landing.howItWorks')}</a>
        <Link href="/for-creators" className="text-brand-red hover:text-red-400 transition font-semibold">{t('landing.forCreators')} ↗</Link>
      </nav>
      <div className="flex items-center gap-3">
        <LanguageSelector compact />
        <Link href="/login"    className="hidden sm:inline-flex px-5 py-2 rounded-lg border border-brand-border text-brand-text text-sm hover:bg-brand-surface transition">{t('landing.login')}</Link>
        <Link href="/register" className="px-5 py-2 rounded-lg bg-brand-red text-white font-bold text-sm hover:bg-red-600 transition">{t('landing.subscribeNow')}</Link>
      </div>
    </header>
  )
}