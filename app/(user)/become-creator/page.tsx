'use client'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Star, Check, Clock, XCircle } from 'lucide-react'
import { useRouter }    from 'next/navigation'
import { useState }     from 'react'
import { toast }        from 'sonner'
import api              from '@/lib/api'

const perks = [
  'Monetarisiere deinen Content mit Abonnements',
  'Erhalte BangCoins von Fans über Trinkgeld und Nachrichten',
  'Gehe live und verdiene Coin-Tipps in Echtzeit',
  'Schalte Premium-DM-Preise frei',
  'Zahle direkt auf PayPal oder Bankkonto aus',
  'Analytics-Dashboard und Einnahmen-Tracker',
]

type AppStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

interface ApplicationData {
  id: string
  status: AppStatus
  adminNote: string | null
  createdAt: string
}

export default function BecomeCreatorPage() {
  const router  = useRouter()
  const [note, setNote] = useState('')

  const { data: appData, isLoading, refetch } = useQuery<{ success: boolean; data: ApplicationData | null }>({
    queryKey: ['my-creator-application'],
    queryFn:  () => api.get('/creators/my-application').then(r => r.data),
  })

  const application = appData?.data

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post('/creators/become', { note: note.trim() || undefined }),
    onSuccess:  () => {
      toast.success('Bewerbung eingereicht! Wir prüfen sie in Kürze.')
      refetch()
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Etwas ist schiefgelaufen. Bitte versuche es erneut.'),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ff0618] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── Pending state ──────────────────────────────────────────────────────────
  if (application?.status === 'PENDING') {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/10 border-2 border-yellow-500/30 mb-6">
            <Clock size={36} className="text-yellow-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-3">Bewerbung wird geprüft</h1>
          <p className="text-gray-400 mb-6">
            Deine Creator-Bewerbung wurde eingereicht und wartet auf die Prüfung durch unser Team. Wir antworten normalerweise innerhalb von 24 bis 48 Stunden.
          </p>
          <p className="text-xs text-gray-500">
            Eingereicht am {new Date(application.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    )
  }

  // ── Rejected state ─────────────────────────────────────────────────────────
  if (application?.status === 'REJECTED') {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-900/30 border-2 border-red-700/40 mb-6">
            <XCircle size={36} className="text-red-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-3">Bewerbung nicht genehmigt</h1>
          {application.adminNote && (
            <p className="text-gray-400 mb-6 bg-[#1a1a1a] rounded-xl p-4 text-sm text-left border border-[#333]">
              <span className="text-gray-500 block mb-1 text-xs uppercase tracking-wider">Grund</span>
              {application.adminNote}
            </p>
          )}
          <p className="text-gray-500 text-sm mb-8">Du kannst dich unten erneut bewerben.</p>

          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Füge eine Notiz zu deiner erneuten Bewerbung hinzu (optional)"
            rows={3}
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl p-3 text-sm text-gray-300 placeholder-gray-600 resize-none mb-4 focus:outline-none focus:border-[#ff0618]"
          />
          <button
            onClick={() => mutate()}
            disabled={isPending}
            className="w-full bg-[#ff0618] hover:bg-red-500 text-white font-bold py-4 rounded-2xl text-lg transition disabled:opacity-50"
          >
            {isPending ? 'Wird eingereicht...' : 'Erneut bewerben'}
          </button>
        </div>
      </div>
    )
  }

  // ── Default: no application yet ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#ff0618]/10 border-2 border-[#ff0618]/30 mb-6">
          <Star size={36} className="text-[#ff0618] fill-[#ff0618]/30" />
        </div>

        <h1 className="text-4xl font-extrabold text-white mb-3">
          Creator werden
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          Verwandle deine Leidenschaft in Einkommen. Werde Teil der Creator, die mit BangMe verdienen.
        </p>

        <ul className="bg-[#161616] rounded-2xl p-6 mb-6 text-left space-y-3 border border-[#222]">
          {perks.map((perk) => (
            <li key={perk} className="flex items-center gap-3 text-gray-300 text-sm">
              <Check size={16} className="text-[#ff0618] shrink-0" />
              {perk}
            </li>
          ))}
        </ul>

        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Erzähl uns kurz von dir oder dem Content, den du erstellen möchtest (optional)"
          rows={3}
          className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl p-3 text-sm text-gray-300 placeholder-gray-600 resize-none mb-4 focus:outline-none focus:border-[#ff0618]"
        />

        <button
          onClick={() => mutate()}
          disabled={isPending}
          className="w-full bg-[#ff0618] hover:bg-red-500 text-white font-bold py-4 rounded-2xl text-lg transition disabled:opacity-50"
        >
          {isPending ? 'Wird eingereicht...' : 'Als Creator bewerben'}
        </button>

        <p className="text-xs text-gray-500 mt-4">
          Bewerbungen werden von unserem Team geprüft. Mit deiner Bewerbung stimmst du unseren Nutzungsbedingungen zu. Die Plattform behält 25% der Einnahmen ein.
        </p>
      </div>
    </div>
  )
}
