'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function AuthHandler() {
  const router = useRouter()

  useEffect(() => {
    // Handle auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // User just signed in, redirect to account
        router.push('/account')
      }
    })

    // Handle hash fragments (for OAuth implicit flow)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      
      if (accessToken && refreshToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(() => {
          // Clear the hash and redirect to account
          window.history.replaceState(null, '', window.location.pathname)
          router.push('/account')
        })
      }
    }

    return () => subscription.unsubscribe()
  }, [router])

  return null
}