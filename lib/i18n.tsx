'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Language = 'en' | 'de'
export type TranslationKey = keyof typeof translations.en

type I18nContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey) => string
}

const STORAGE_KEY = 'bangme.language'

const STATIC_TEXT_TRANSLATIONS: Array<[de: string, en: string]> = [
  ['Abonnieren', 'Subscribe'],
  ['Jetzt abonnieren', 'Subscribe Now'],
  ['Zum Freischalten abonnieren', 'Subscribe to Unlock'],
  ['Account erstellen & abonnieren', 'Create Account & Subscribe'],
  ['Creator ansehen', 'Browse Creators'],
  ['Creator entdecken', 'Explore Creators'],
  ['Alle Creator ansehen', 'See All Creators'],
  ['Kostenlosen Account erstellen', 'Create a Free Account'],
  ['Favoriten entdecken', 'Discover Your Favourites'],
  ['Abonnieren & freischalten', 'Subscribe & Unlock'],
  ['Exklusiver Content. Keine kostenlosen Pässe.', 'Exclusive Content. No Free Passes.'],
  ['Exklusiver Beitrag', 'Exclusive Post'],
  ['Neue Fotos', 'New Photos'],
  ['Vollständiges Video', 'Full Video'],
  ['PPV-Inhalt', 'PPV Content'],
  ['Hinter den Kulissen', 'Behind the Scenes'],
  ['Live-Aufnahme', 'Live Recording'],
  ['Nur für Abonnenten', 'Subscribers Only'],
  ['Kostenlos beitreten und mehr sehen', 'Join Free to See More'],
  ['Was dich erwartet', "What's Inside"],
  ['Exklusiver Content wartet auf dich', 'Exclusive Content Waiting for You'],
  ['Wer gerade angesagt ist', "Who's Hot Right Now"],
  ['Empfohlene Creator', 'Featured Creators'],
  ['Beiträge', 'posts'],
  ['Fans', 'fans'],
  ['Ganz einfach', 'Super Easy'],
  ['So funktioniert es für Fans', 'How It Works for Fans'],
  ['Warum Fans BANGME lieben', 'Why Fans Love BANGME'],
  ['Mehr als ein Feed.', 'More than a feed.'],
  ['Eine echte', 'A real'],
  ['Verbindung.', 'connection.'],
  ['Wirklich exklusiver Content', 'Truly Exclusive Content'],
  ['Direkt mit Creatorn schreiben', 'Direct Message Creators'],
  ['Private Livestreams', 'Private Live Streams'],
  ['Pay-per-View-Beiträge', 'Pay-Per-View Posts'],
  ['Jederzeit kündbar', 'Cancel Any Time'],
  ['Neue Abonnenten heute', 'New subscribers today'],
  ['Nach Kategorie stöbern', 'Browse by Category'],
  ['Finde deinen Typ', 'Find Your Type'],
  ['Aus unserer Community', 'From Our Community'],
  ['Fans lieben BANGME', 'Fans Love BANGME'],
  ['Bist du Creator?', 'Are you a creator?'],
  ['Hier Geld verdienen', 'Start earning here'],
  ['Entdecken', 'Discover'],
  ['Für Fans', 'For Fans'],
  ['Für Creator', 'For Creators'],
  ['Alle Creator', 'All Creators'],
  ['Musik', 'Music'],
  ['So funktioniert es', 'How It Works'],
  ['Preise', 'Pricing'],
  ['Geschenkkarten', 'Gift Cards'],
  ['Geld verdienen', 'Start Earning'],
  ['Auszahlungen', 'Payouts'],
  ['Datenschutzerklärung', 'Privacy Policy'],
  ['Nutzungsbedingungen', 'Terms of Service'],
  ['Cookie-Richtlinie', 'Cookie Policy'],
  ['Alle Rechte vorbehalten.', 'All rights reserved.'],
  ['Nachrichten', 'Messages'],
  ['Nachricht schreiben...', 'Type a message...'],
  ['Senden', 'Send'],
  ['Abbrechen', 'Cancel'],
  ['Schließen', 'Close'],
  ['Speichern', 'Save'],
  ['Ändern', 'Change'],
  ['Bearbeiten', 'Edit'],
  ['Löschen', 'Delete'],
  ['Wird geladen...', 'Loading...'],
  ['Wird gesendet...', 'Sending...'],
  ['Noch keine Nachrichten', 'No messages yet'],
  ['Noch keine Unterhaltungen', 'No conversations yet'],
  ['Jemand schreibt...', 'Someone is typing...'],
  ['Verbunden', 'Connected'],
  ['Getrennt', 'Disconnected'],
  ['Unbekannt', 'Unknown'],
  ['Audioanruf', 'Audio Call'],
  ['Videoanruf', 'Video Call'],
  ['kostenlos', 'Free'],
  ['Kostenlos für Creator', 'Free for creators'],
  ['Anruf starten', 'Start Call'],
  ['Anruf fehlgeschlagen', 'Call failed'],
  ['Unterhaltungen werden geladen...', 'Loading conversations...'],
  ['Wähle eine Unterhaltung aus, um zu schreiben', 'Select a conversation to start messaging'],
  ['BangCoins pro Minute', 'BangCoins per minute'],
  ['Geschätzte Kosten für 10 Minuten:', 'Estimated cost for 10 minutes:'],
  ['Dein Browser fragt nach Kamera- und Mikrofonzugriff.', 'Your browser will ask for camera & microphone access.'],
  ['BangCoins Wallet', 'BangCoins Wallet'],
  ['Aktuelles Guthaben', 'Current Balance'],
  ['Aufladen', 'Top Up'],
  ['Auszahlen', 'Cash Out'],
  ['Transaktionen', 'Transactions'],
  ['Meine Einnahmen', 'My Earnings'],
  ['Meine Ausgaben', 'My Spending'],
  ['Betrag auswählen', 'Select Amount'],
  ['Eigener Betrag', 'Custom Amount'],
  ['Auswählen', 'Select'],
  ['Nur für Creator', 'Creators Only'],
  ['Creator werden', 'Become a Creator'],
  ['Auszahlungsmethode', 'Payout Method'],
  ['Nicht festgelegt', 'Not set'],
  ['Transaktionen werden geladen...', 'Loading transactions...'],
  ['Noch keine Transaktionen.', 'No transactions yet.'],
  ['Typ', 'Type'],
  ['Betrag', 'Amount'],
  ['Notiz', 'Note'],
  ['Status', 'Status'],
  ['Datum', 'Date'],
  ['Zurück', 'Back'],
  ['Weiter', 'Next'],
  ['Bestätigen', 'Confirm'],
  ['Erstellen', 'Create'],
  ['Veröffentlichen', 'Post'],
  ['Beitrag erstellen', 'Create Post'],
  ['Nutzer', 'User'],
  ['Was möchtest du teilen?', 'What would you like to share?'],
  ['Wer kann diesen Beitrag sehen?', 'Who can see this post?'],
  ['Öffentlich', 'Public'],
  ['Abonnenten', 'Subscribers'],
  ['Als Premium-Beitrag markieren', 'Mark as premium post'],
  ['Nur zahlende Abonnenten können diesen Inhalt sehen', 'Only paying subscribers can see this content'],
  ['Preis (BangCoins)', 'Price (BangCoins)'],
  ['Umsatzaufteilung', 'Revenue split'],
  ['Inhaltspreis:', 'Content price:'],
  ['Plattformgebühr (25%):', 'Platform fee (25%):'],
  ['Steuer (17%):', 'Tax (17%):'],
  ['Du erhältst:', 'You receive:'],
  ['des Originalpreises', 'of the original price'],
  ['Die Datei muss kleiner als 50 MB sein', 'File must be smaller than 50 MB'],
  ['Bitte wähle eine Bild- oder Videodatei aus', 'Please choose an image or video file'],
  ['Bitte füge eine Bildunterschrift oder Medien hinzu', 'Please add a caption or media'],
  ['Bitte gib einen gültigen Premium-Preis ein', 'Please enter a valid premium price'],
  ['Der Premium-Preis muss mindestens $1 betragen', 'The premium price must be at least $1'],
  ['Medien konnten nicht hochgeladen werden', 'Media could not be uploaded'],
  ['Beitrag konnte nicht erstellt werden', 'Post could not be created'],
  ['Beitrag erfolgreich erstellt!', 'Post created successfully!'],
  ['Beitrag aktualisiert!', 'Post updated!'],
  ['Beitrag freigeschaltet!', 'Post unlocked!'],
  ['Nicht genug BangCoins', 'Not enough BangCoins'],
  ['Folgen', 'Follow'],
  ['Folge ich', 'Following'],
  ['Follower', 'Followers'],
  ['Profil ansehen', 'View Profile'],
  ['Gerade keine Livestreams', 'No live streams right now'],
  ['Benachrichtigungen', 'Notifications'],
  ['Keine Benachrichtigungen', 'No notifications'],
  ['Als gelesen markieren', 'Mark as read'],
  ['Einstellungen', 'Settings'],
  ['Profil', 'Profile'],
  ['Startseite', 'Home'],
  ['Einloggen', 'Log In'],
  ['Registrieren', 'Sign up'],
]

export const languages: { code: Language; shortLabel: string; label: string; nativeLabel: string; flag: 'us' | 'de' }[] = [
  { code: 'en', shortLabel: 'EN', label: 'English', nativeLabel: 'English', flag: 'us' },
  { code: 'de', shortLabel: 'DE', label: 'German', nativeLabel: 'Deutsch', flag: 'de' },
]

const translations = {
  en: {
    'common.language': 'Language',
    'common.english': 'English',
    'common.german': 'Deutsch',
    'common.view': 'View',
    'common.signUp': 'Sign up',
    'common.signOut': 'Sign Out',
    'nav.home': 'Home',
    'nav.discover': 'Discover',
    'nav.live': 'Live',
    'nav.profile': 'Profile',
    'nav.notifications': 'Notifications',
    'nav.messages': 'Messages',
    'nav.bangcoins': 'BangCoins',
    'nav.creatorCenter': 'Creator Center',
    'nav.becomeCreator': 'Become Creator',
    'nav.settings': 'Settings',
    'nav.posts': 'Posts',
    'nav.followers': 'Followers',
    'nav.following': 'Following',
    'landing.explore': 'Explore',
    'landing.creators': 'Creators',
    'landing.categories': 'Categories',
    'landing.howItWorks': 'How It Works',
    'landing.forCreators': 'For Creators',
    'landing.login': 'Log In',
    'landing.subscribeNow': 'Subscribe Now',
    'notifications.newLike': 'liked your post.',
    'notifications.newComment': 'commented on your post.',
    'notifications.newFollower': 'started following you.',
    'notifications.newSubscriber': 'subscribed to your content.',
    'notifications.newMessage': 'sent you a message.',
    'notifications.newTip': 'sent you a tip.',
    'notifications.default': 'sent you a notification.',
  },
  de: {
    'common.language': 'Sprache',
    'common.english': 'Englisch',
    'common.german': 'Deutsch',
    'common.view': 'Ansehen',
    'common.signUp': 'Registrieren',
    'common.signOut': 'Abmelden',
    'nav.home': 'Startseite',
    'nav.discover': 'Entdecken',
    'nav.live': 'Live',
    'nav.profile': 'Profil',
    'nav.notifications': 'Benachrichtigungen',
    'nav.messages': 'Nachrichten',
    'nav.bangcoins': 'BangCoins',
    'nav.creatorCenter': 'Creator Center',
    'nav.becomeCreator': 'Creator werden',
    'nav.settings': 'Einstellungen',
    'nav.posts': 'Beiträge',
    'nav.followers': 'Follower',
    'nav.following': 'Folge ich',
    'landing.explore': 'Entdecken',
    'landing.creators': 'Creator',
    'landing.categories': 'Kategorien',
    'landing.howItWorks': 'So funktioniert es',
    'landing.forCreators': 'Für Creator',
    'landing.login': 'Einloggen',
    'landing.subscribeNow': 'Jetzt abonnieren',
    'notifications.newLike': 'gefällt dein Beitrag.',
    'notifications.newComment': 'hat deinen Beitrag kommentiert.',
    'notifications.newFollower': 'folgt dir jetzt.',
    'notifications.newSubscriber': 'hat deine Inhalte abonniert.',
    'notifications.newMessage': 'hat dir eine Nachricht gesendet.',
    'notifications.newTip': 'hat dir ein Trinkgeld gesendet.',
    'notifications.default': 'hat dir eine Benachrichtigung gesendet.',
  },
} as const

const I18nContext = createContext<I18nContextValue | null>(null)

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'de'

  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'en' || saved === 'de') return saved

  return window.navigator.language.toLowerCase().startsWith('en') ? 'en' : 'de'
}

function translateStaticText(text: string, language: Language) {
  if (language === 'de') return text

  return STATIC_TEXT_TRANSLATIONS.reduce((current, [de, en]) => {
    return current.split(de).join(en)
  }, text)
}

function applyStaticTranslations(language: Language) {
  const elements = document.body.querySelectorAll<HTMLElement>('*')

  elements.forEach((element) => {
    if (element.closest('script, style, noscript')) return

    for (const attr of ['placeholder', 'title', 'aria-label'] as const) {
      const currentValue = element.getAttribute(attr)
      if (!currentValue) continue

      const originalAttr = `data-i18n-original-${attr}`
      const originalValue = element.getAttribute(originalAttr) ?? currentValue
      if (!element.hasAttribute(originalAttr)) element.setAttribute(originalAttr, originalValue)
      element.setAttribute(attr, translateStaticText(originalValue, language))
    }

    element.childNodes.forEach((node) => {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) return

      const textNode = node as Text & { __bangmeOriginalText?: string }
      textNode.__bangmeOriginalText ??= textNode.textContent ?? ''
      textNode.textContent = translateStaticText(textNode.__bangmeOriginalText, language)
    })
  })
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)

  useEffect(() => {
    document.documentElement.lang = language
    window.localStorage.setItem(STORAGE_KEY, language)
    applyStaticTranslations(language)

    const observer = new MutationObserver(() => applyStaticTranslations(language))
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [language])

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage: setLanguageState,
    t: (key) => translations[language][key] ?? translations.en[key],
  }), [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used within I18nProvider')
  return context
}