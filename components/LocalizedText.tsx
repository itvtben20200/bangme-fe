'use client'

import { useI18n } from '@/lib/i18n'

type LocalizedTextProps = {
  en: string
  de: string
}

export function LocalizedText({ en, de }: LocalizedTextProps) {
  const { language } = useI18n()
  return <>{language === 'de' ? de : en}</>
}