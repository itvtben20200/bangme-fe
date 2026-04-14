'use client'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const { user, accessToken, restoreSession } = useAuthStore()

  useEffect(() => {
    // Re-hydrate user from the server whenever the user object is missing
    // but an access token is present (e.g. after a hard refresh)
    if (!user && accessToken) {
      restoreSession()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>
}
