'use client'

import { useState } from 'react'
import { 
  PaymentElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js'
import { toast } from 'sonner'

interface CheckoutFormProps {
  onSuccess: () => void
  amount: number
}

export function CheckoutForm({ onSuccess, amount }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/bangcoins?success=true`,
        },
      })

      if (error) {
        setErrorMessage(error.message || 'Payment failed')
        toast.error(error.message || 'Payment failed')
      } else {
        // Payment succeeded
        onSuccess()
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred')
      toast.error('Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement 
        options={{
          layout: 'tabs',
        }}
      />

      {errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-brand-red text-white font-bold py-3 rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <span>🔒</span>
            <span>Pay ${amount}</span>
          </>
        )}
      </button>

      <p className="text-xs text-center text-brand-muted">
        Secured by Stripe · Your payment information is encrypted
      </p>
    </form>
  )
}
