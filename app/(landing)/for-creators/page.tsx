import Link from 'next/link'
import { CalendarDays, CreditCard, Diamond, FileText, Rocket, Shield, Star, Users } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'

const heroImageSrc = '/images/girl-back.png'

const benefits = [
  { icon: Star, title: 'Founding Creator Status', text: 'Sei sichtbar als einer der ersten BangMe Creator.' },
  { icon: CreditCard, title: 'Limitierte Founder Card', text: 'Deine persönliche, nummerierte Karte der ersten 100.' },
  { icon: CalendarDays, title: 'Exklusive Events', text: 'Einladungen zu ausgewählten Creator-Anlässen.' },
  { icon: Users, title: 'Besondere Vorteile', text: 'Zugang zu Founder-Aktionen vor dem offiziellen Launch.' },
  { icon: Diamond, title: 'Mehr Möglichkeiten', text: 'Sichere dir frühe Vorteile für die kommende Plattform.' },
]

const steps = [
  { icon: FileText, title: 'Jetzt registrieren', text: 'E-Mail, Benutzername und deine Daten angeben.' },
  { icon: Shield, title: 'Platz wird reserviert', text: 'Deine Daten werden sicher gespeichert.' },
  { icon: CalendarDays, title: 'Du wirst kontaktiert', text: 'Bei Auswahl erhältst du weitere Informationen.' },
  { icon: Rocket, title: 'Early Access', text: 'Sei beim Launch als einer der Ersten dabei.' },
]

export default function ForCreatorsPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <section className="relative border-b border-white/10 bg-[radial-gradient(ellipse_at_18%_42%,rgba(255,6,24,0.16),transparent_34%),radial-gradient(circle_at_20%_35%,rgba(255,255,255,0.08),transparent_24%),linear-gradient(180deg,#050505,#000)]">
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black to-transparent" />
        <div className="relative mx-auto max-w-7xl px-5 py-3 sm:px-8 lg:px-10">
          <header className="flex items-start justify-between gap-4">
            <BrandLogo href="/" imageClassName="h-8 sm:h-9 w-auto max-w-[150px]" priority />
            <Link href="/for-creators/register" className="rounded-md border border-[#ff0618] px-5 py-2 text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#ff0618]">
              Nur 100 Plätze
            </Link>
          </header>
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-6 px-5 pb-0 sm:px-8 lg:min-h-[616px] lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:px-10 lg:pt-2">
          <div className="flex flex-col justify-between gap-12">
            <div className="max-w-[640px] py-8 lg:py-0">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.48em] text-white/70 sm:text-sm">Von Anfang an dabei</p>
              <h1 className="text-[clamp(2.85rem,5.2vw,4.9rem)] font-black uppercase leading-[0.9] tracking-normal">
                Sei eine der<br />
                <span className="text-[#ff0618]">ersten</span> 100
              </h1>
              <p className="mt-5 max-w-xl text-base font-medium uppercase tracking-[0.32em] text-white/78 sm:text-lg lg:text-xl">
                Sichere dir deinen Platz.
                <span className="block">Von Anfang an dabei.</span>
              </p>

              <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-4">
                {benefits.slice(0, 4).map((benefit) => {
                  const Icon = benefit.icon
                  return (
                    <div key={benefit.title} className="text-center">
                      <Icon className="mx-auto h-10 w-10 text-[#ff0618]" strokeWidth={1.8} />
                      <p className="mt-3 text-[11px] font-black uppercase leading-tight text-white">{benefit.title}</p>
                    </div>
                  )
                })}
              </div>

              <Link href="/for-creators/register" className="mt-10 inline-flex w-full max-w-[500px] items-center justify-center gap-3 rounded-full bg-[#ff0618] px-6 py-4 text-lg font-black uppercase text-white shadow-[0_0_42px_rgba(255,6,24,0.36)] transition hover:bg-red-600 sm:w-auto sm:min-w-[420px] sm:gap-5 sm:px-8 sm:py-4 sm:text-xl">
                Jetzt voranmelden
                <span aria-hidden="true" className="text-2xl">-&gt;</span>
              </Link>
              <p className="mt-4 text-center text-[11px] uppercase tracking-[0.48em] text-white/55 sm:max-w-[500px]">Nur 100 Plätze. Launch bald.</p>
            </div>
          </div>

          <div className="relative hidden min-h-[616px] items-start justify-start lg:flex">
            <div className="relative -mt-16 h-[680px] w-[474px]">
              <img
                src={heroImageSrc}
                alt="BangMe Founding Creator"
                className="h-[680px] w-[474px] object-contain object-bottom"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/45 to-transparent" />
            </div>
            <div className="absolute right-0 top-[34%] max-w-[190px] rotate-[-7deg] text-center text-white/90">
              <p className="font-serif text-[2.35rem] italic leading-[0.95] tracking-normal drop-shadow-[0_0_10px_rgba(255,255,255,0.18)]">
                Von<br />
                Anfang an<br />
                dabei.
              </p>
              <div className="mt-3 h-5 w-36 rotate-[-5deg] rounded-[50%] border-b-[5px] border-[#ff0618]" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-white/10 bg-black px-5 py-16 sm:px-8 lg:px-10">
        <div className="relative mx-auto flex min-h-[360px] max-w-7xl items-center">
          <img
            src="/images/cards.png"
            alt="BangMe Founding Creator Card"
            className="pointer-events-none absolute bottom-0 right-0 hidden h-full w-[68%] object-contain object-right-bottom opacity-95 [mask-image:linear-gradient(90deg,transparent_0%,black_24%,black_100%)] lg:block"
          />
          <div className="relative z-10 max-w-md">
            <h2 className="text-4xl font-black uppercase leading-none sm:text-5xl">
              Deine exklusive<br />
              <span className="text-[#ff0618]">Founder Card</span>
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-white/80">
              Eine limitierte, nummerierte Karte für die ersten 100 BangMe Creator. Ein Zeichen dafür, dass du von Anfang an dabei warst.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-black px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-black uppercase sm:text-4xl">Exklusive <span className="text-[#ff0618]">Vorteile</span></h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {benefits.map((benefit) => {
              const Icon = benefit.icon
              return (
                <div key={benefit.title} className="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-center">
                  <Icon className="mx-auto h-11 w-11 text-[#ff0618]" strokeWidth={1.7} />
                  <h3 className="mt-4 text-base font-bold leading-tight text-white">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{benefit.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#030303,#000)] px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl rounded-lg border border-white/15 bg-white/[0.02] p-6 sm:p-8">
          <h2 className="text-3xl font-black uppercase sm:text-4xl">Wie es <span className="text-[#ff0618]">weitergeht</span></h2>
          <div className="mt-8 grid gap-8 md:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="relative text-center">
                  {index < steps.length - 1 && <span className="absolute right-[-18px] top-7 hidden text-3xl text-white/70 md:block">-&gt;</span>}
                  <Icon className="mx-auto h-10 w-10 text-white" strokeWidth={1.6} />
                  <h3 className="mt-4 font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{step.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl items-end justify-between gap-6">
          <BrandLogo href="/" imageClassName="h-6 w-auto max-w-[118px]" />
          <p className="text-xs uppercase tracking-[0.55em] text-white/65">Launcht 2027</p>
        </div>
      </footer>
    </main>
  )
}
