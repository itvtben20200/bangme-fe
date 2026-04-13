'use client'
import { useMutation }  from '@tanstack/react-query'
import { Star, Check }  from 'lucide-react'
import { useRouter }    from 'next/navigation'
import { toast }        from 'sonner'
import api              from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const perks = [
  'Monetize your content with subscriptions',
  'Receive BangCoins from fans via tips & messages',
  'Go live and earn real-time coin tips',
  'Unlock premium DM pricing',
  'Cash out directly to PayPal or bank',
  'Analytics dashboard & earnings tracker',
]

export default function BecomeCreatorPage() {
  const router = useRouter()
  const { updateRole } = useAuthStore()

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post('/creators/become'),
    onSuccess:  () => {
      toast.success('Welcome, Creator! 🎉')
      updateRole('creator')
      router.push('/creator-center')
    },
    onError: () => toast.error('Something went wrong. Please try again.'),
  })

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#ff4757]/10 border-2 border-[#ff4757]/30 mb-6">
          <Star size={36} className="text-[#ff4757] fill-[#ff4757]/30" />
        </div>

        <h1 className="text-4xl font-extrabold text-white mb-3">
          Become a Creator
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          Turn your passion into income. Join thousands of creators earning with BangMe.
        </p>

        {/* Perks */}
        <ul className="bg-[#161616] rounded-2xl p-6 mb-8 text-left space-y-3 border border-[#222]">
          {perks.map((perk) => (
            <li key={perk} className="flex items-center gap-3 text-gray-300 text-sm">
              <Check size={16} className="text-[#ff4757] shrink-0" />
              {perk}
            </li>
          ))}
        </ul>

        <button
          onClick={() => mutate()}
          disabled={isPending}
          className="w-full bg-[#ff4757] hover:bg-red-500 text-white font-bold py-4 rounded-2xl text-lg transition disabled:opacity-50"
        >
          {isPending ? 'Activating…' : 'Activate Creator Account — It\'s Free'}
        </button>

        <p className="text-xs text-gray-500 mt-4">
          By continuing you agree to our Terms of Service. Platform takes 25% of earnings.
        </p>
      </div>
    </div>
  )
}
