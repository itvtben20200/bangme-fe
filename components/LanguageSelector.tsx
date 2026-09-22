'use client'

import { Check, ChevronDown } from 'lucide-react'
import { languages, useI18n } from '@/lib/i18n'

type LanguageSelectorProps = {
  compact?: boolean
}

function FlagIcon({ flag }: { flag: 'us' | 'de' }) {
  if (flag === 'de') {
    return (
      <span className="grid h-3.5 w-5 overflow-hidden rounded-sm border border-white/20 shadow-sm" aria-hidden="true">
        <span className="bg-black" />
        <span className="bg-[#dd0000]" />
        <span className="bg-[#ffce00]" />
      </span>
    )
  }

  return (
    <span className="relative h-3.5 w-5 overflow-hidden rounded-sm border border-white/20 bg-white shadow-sm" aria-hidden="true">
      <span className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,#b22234_0,#b22234_1px,#fff_1px,#fff_2px)]" />
      <span className="absolute left-0 top-0 h-[7px] w-[9px] bg-[#3c3b6e]" />
      <span className="absolute left-[2px] top-[1px] h-0.5 w-0.5 rounded-full bg-white shadow-[3px_0_0_white,6px_0_0_white,0_2px_0_white,3px_2px_0_white,6px_2px_0_white,0_4px_0_white,3px_4px_0_white,6px_4px_0_white]" />
    </span>
  )
}

export function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useI18n()
  const currentLanguage = languages.find(item => item.code === language) ?? languages[0]

  return (
    <div className="group relative">
      <button
        type="button"
        className="flex items-center gap-2 rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-brand-card"
        aria-label={t('common.language')}
      >
        <FlagIcon flag={currentLanguage.flag} />
        <span>{compact ? currentLanguage.shortLabel : currentLanguage.nativeLabel}</span>
        <ChevronDown size={14} className="text-brand-muted transition group-hover:rotate-180" />
      </button>

      <div className="invisible absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-brand-border bg-brand-surface opacity-0 shadow-2xl shadow-black/30 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        {languages.map(item => {
          const active = item.code === language
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => setLanguage(item.code)}
              className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${active ? 'bg-brand-red/10 text-white' : 'text-brand-text hover:bg-brand-card hover:text-white'}`}
            >
              <span className="flex items-center gap-3">
                <FlagIcon flag={item.flag} />
                <span>{item.nativeLabel}</span>
              </span>
              {active && <Check size={16} className="text-brand-red" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}